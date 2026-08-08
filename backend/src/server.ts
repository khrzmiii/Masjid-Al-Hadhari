import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { randomUUID, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { verifyToken, verifySuperAdmin, verifyRole, AuthRequest } from './middleware/auth';
import multer from 'multer';
import path from 'path';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Configure Multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

const memoryStorage = multer.memoryStorage();
const memoryUpload = multer({ storage: memoryStorage });

// API versioning as per PRD
const router = express.Router();

// --- Upload Endpoint ---
router.post('/upload', verifyToken, memoryUpload.single('image'), (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Convert buffer to base64 data URI to avoid Render ephemeral file system issues
  const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  res.status(200).json({ url: base64Image });
});

// --- Public Endpoints ---
router.get('/public/prayer-times', async (req: Request, res: Response) => {
  try {
    const zone = (req.query.zone as string) || "SBH07";
    
    // Fetch live data from e-solat JAKIM
    const jakimUrl = `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=today&zone=${zone}`;
    const response = await fetch(jakimUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch from JAKIM: ${response.statusText}`);
    }
    
    const jakimData = await response.json();
    
    if (jakimData.status !== 'OK!' || !jakimData.prayerTime || jakimData.prayerTime.length === 0) {
      throw new Error('Invalid data format from JAKIM API');
    }
    
    const todayData = jakimData.prayerTime[0];
    
    // Format times to HH:mm by removing seconds if necessary
    const formatTime = (timeStr: string) => {
      if (!timeStr) return "";
      const parts = timeStr.split(':');
      if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}`;
      }
      return timeStr;
    };
    
    res.status(200).json({
      data: {
        zone: jakimData.zone || zone,
        date: new Date().toISOString().split('T')[0],
        hijri: todayData.hijri, // 1448-02-19
        times: {
          fajr: formatTime(todayData.fajr),
          syuruk: formatTime(todayData.syuruk),
          dhuhr: formatTime(todayData.dhuhr),
          asr: formatTime(todayData.asr),
          maghrib: formatTime(todayData.maghrib),
          isha: formatTime(todayData.isha)
        }
      },
      meta: {
        source: "e-solat-jakim",
        last_updated: jakimData.serverTime || new Date().toISOString(),
        stale: false
      }
    });
  } catch (error) {
    console.error("Prayer times error:", error);
    // Fallback to basic times if JAKIM is down
    res.status(200).json({
      data: {
        zone: req.query.zone || "SBH07",
        date: new Date().toISOString().split('T')[0],
        times: {
          fajr: "04:50",
          syuruk: "06:15",
          dhuhr: "12:20",
          asr: "15:40",
          maghrib: "18:25",
          isha: "19:35"
        }
      },
      meta: {
        source: "mock-fallback",
        error: error instanceof Error ? error.message : "Unknown error",
        stale: true
      }
    });
  }
});

import { getDb } from './db';

router.get('/public/announcements', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const rows = await db.all("SELECT * FROM announcements WHERE status = 'published' ORDER BY created_at DESC");
    res.status(200).json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Get Public Events (Calendar)
router.get('/public/events', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const rows = await db.all("SELECT * FROM events WHERE status = 'published' ORDER BY event_date ASC");
    res.status(200).json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/public/events/:id/image', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const event = await db.get('SELECT image_url FROM events WHERE id = ?', [req.params.id]);
    if (!event || !event.image_url) {
      return res.status(404).send('Image not found');
    }
    
    const matches = event.image_url.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).send('Invalid image format');
    }
    
    const type = matches[1];
    const data = Buffer.from(matches[2], 'base64');
    
    res.set('Content-Type', `image/${type}`);
    res.set('Cache-Control', 'public, max-age=31536000');
    res.send(data);
  } catch (err) {
    res.status(500).send('Internal Server Error');
  }
});

// Submit Public Forms
router.post('/public/forms', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { form_type, submitter_name, submitter_email, submitter_phone, details } = req.body;
    if (!form_type || !submitter_name) return res.status(400).json({ error: 'Borang tidak lengkap.' });
    const id = randomUUID();
    await db.run(
      `INSERT INTO form_submissions (id, form_type, submitter_name, submitter_email, submitter_phone, details) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, form_type, submitter_name, submitter_email, submitter_phone, JSON.stringify(details || {})]
    );
    res.status(201).json({ success: true, message: 'Borang berjaya dihantar.', id });
  } catch (err) {
    console.error('Form submission error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// --- Auth Endpoints ---
const JWT_SECRET = process.env.JWT_SECRET || 'rahsia_masjid_123';
const GOOGLE_CLIENT_ID = '783033815393-v7ov3t2urut7aa30o7b37cuaaberd8pg.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Sila lengkapkan semua maklumat.' });
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) return res.status(400).json({ error: 'Emel ini telah didaftarkan.' });
    const hash = await bcrypt.hash(password, 10);
    const id = randomUUID();
    const verificationToken = randomBytes(32).toString('hex');
    await db.run(
      'INSERT INTO users (id, name, email, password_hash, role, auth_provider, email_verified, verification_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, email, hash, 'public', 'local', false, verificationToken]
    );
    const baseUrl = process.env.APP_URL || 'https://masjid-al-hadhari.onrender.com';
    const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}`;
    const emailHtml = `<div style="font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px"><h2 style="color:#047857;text-align:center">Selamat Datang!</h2><p>Terima kasih kerana mendaftar akaun di Sistem Pengurusan Masjid Al-Hadhari.</p><div style="text-align:center;margin:30px 0"><a href="${verificationLink}" style="background-color:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block">Sahkan E-mel Saya</a></div><p style="font-size:13px;color:#6b7280;text-align:center">Pautan: ${verificationLink}</p></div>`;
    if (process.env.BREVO_API_KEY) {
      // Brevo (Sendinblue) - HTTPS API, tiada domain diperlukan, percuma 300 e-mel/hari
      try {
        console.log(`[BREVO] Cuba hantar e-mel ke: ${email}`);
        const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: 'Sistem Masjid Al-Hadhari', email: process.env.SMTP_USER || 'masjid.alhadhari.web.app@gmail.com' },
            to: [{ email: email, name: name }],
            subject: 'Sahkan E-mel Akaun Anda',
            htmlContent: emailHtml
          })
        });
        const brevoData = await brevoRes.json() as any;
        if (brevoRes.ok) {
          console.log(`[BREVO] E-mel berjaya dihantar ke: ${email}, messageId: ${brevoData.messageId}`);
        } else {
          console.error(`[BREVO ERROR] ${JSON.stringify(brevoData)}`);
        }
      } catch (e: any) { console.error('[BREVO ERROR]', e.message); }
    } else if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({ from: 'Sistem Masjid Al-Hadhari <onboarding@resend.dev>', to: [email], subject: 'Sahkan E-mel Akaun Anda', html: emailHtml });
        console.log(`[RESEND] Berjaya dihantar ke: ${email}`);
      } catch (e: any) { console.error('[RESEND ERROR]', e.message); }
    } else {
      console.log(`[MOCK] Pautan: ${verificationLink}`);
    }
    res.status(201).json({ success: true, message: 'Pendaftaran berjaya. Sila semak peti masuk e-mel anda.' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Ralat pelayan.' });
  }
});

router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Sila masukkan emel dan kata laluan.' });
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'Akaun tidak dijumpai.' });
    if (user.auth_provider === 'google') return res.status(400).json({ error: 'Sila log masuk menggunakan Google.' });
    if (user.email_verified === false || user.email_verified === 0) return res.status(403).json({ error: 'Sila sahkan e-mel anda sebelum log masuk.' });
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Kata laluan tidak sah.' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.status(200).json({ success: true, token, user: { name: user.name, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Ralat pelayan.' });
  }
});

router.post('/auth/verify', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token tidak sah.' });
    const user = await db.get('SELECT * FROM users WHERE verification_token = ?', [token]);
    if (!user) return res.status(400).json({ error: 'Pautan pengesahan tidak sah atau telah luput.' });
    await db.run('UPDATE users SET email_verified = true, verification_token = NULL WHERE id = ?', [user.id]);
    res.status(200).json({ success: true, message: 'E-mel berjaya disahkan. Anda kini boleh log masuk.' });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Ralat pelayan.' });
  }
});

router.post('/auth/resend-verification', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'E-mel diperlukan.' });
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(404).json({ error: 'E-mel tidak dijumpai.' });
    if (user.email_verified) return res.status(400).json({ error: 'E-mel ini sudah disahkan. Sila log masuk.' });
    const verificationToken = randomBytes(32).toString('hex');
    await db.run('UPDATE users SET verification_token = ? WHERE id = ?', [verificationToken, user.id]);
    const baseUrl = process.env.APP_URL || 'https://masjid-al-hadhari.onrender.com';
    const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}`;
    const emailHtml = `<div style="font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px"><h2 style="color:#047857;text-align:center">Sahkan E-mel Anda</h2><p>Klik butang di bawah untuk mengesahkan akaun anda.</p><div style="text-align:center;margin:30px 0"><a href="${verificationLink}" style="background-color:#059669;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block">Sahkan E-mel Saya</a></div><p style="font-size:13px;color:#6b7280;text-align:center">Pautan: ${verificationLink}</p></div>`;
    if (process.env.BREVO_API_KEY) {
      const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'accept': 'application/json', 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json' },
        body: JSON.stringify({ sender: { name: 'Sistem Masjid Al-Hadhari', email: process.env.SMTP_USER || 'masjid.alhadhari.web.app@gmail.com' }, to: [{ email, name: user.name }], subject: 'Sahkan E-mel Akaun Anda', htmlContent: emailHtml })
      });
      const brevoData = await brevoRes.json() as any;
      if (!brevoRes.ok) console.error('[BREVO RESEND ERROR]', JSON.stringify(brevoData));
    }
    res.status(200).json({ success: true, message: 'E-mel pengesahan baharu telah dihantar. Sila semak peti masuk anda.' });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ error: 'Ralat pelayan.' });
  }
});


router.post('/auth/google', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { credential } = req.body;
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) return res.status(400).json({ error: 'Token Google tidak sah.' });
    const email = payload.email;
    const name = payload.name || 'Pengguna Google';
    const googleId = payload.sub;
    let user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (user) {
      if (user.auth_provider === 'local') {
        await db.run('UPDATE users SET auth_provider = ?, google_id = ?, email_verified = true WHERE id = ?', ['google', googleId, user.id]);
        user.auth_provider = 'google'; user.google_id = googleId; user.email_verified = true;
      }
    } else {
      const id = randomUUID();
      const hash = await bcrypt.hash(randomBytes(16).toString('hex'), 10);
      await db.run('INSERT INTO users (id, name, email, password_hash, role, auth_provider, email_verified, google_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [id, name, email, hash, 'public', 'google', true, googleId]);
      user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.status(200).json({ success: true, token, user: { name: user.name, role: user.role } });
  } catch (err) {
    console.error('Google Auth error:', err);
    res.status(500).json({ error: 'Ralat pelayan semasa log masuk Google.' });
  }
});

router.put('/auth/profile', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Nama tidak boleh kosong.' });
    if (!req.user || !req.user.id) return res.status(401).json({ error: 'Tidak dibenarkan.' });
    await db.run('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id]);
    res.status(200).json({ success: true, message: 'Profil berjaya dikemaskini.', user: { name, role: req.user.role } });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Ralat pelayan semasa kemaskini profil.' });
  }
});

// --- Admin Endpoints ---
router.get('/admin/users', verifyToken, verifyRole(['super_admin', 'pengerusi', 'timbalan_pengerusi', 'setiausaha']), async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    let rows;
    if (req.user?.role === 'super_admin') {
      rows = await db.all('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    } else {
      rows = await db.all("SELECT id, name, email, role, created_at FROM users WHERE role != 'super_admin' ORDER BY created_at DESC");
    }
    res.status(200).json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});


// Update user role
router.put('/admin/users/:id/role', verifyToken, verifyRole(['pengerusi']), async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const { role } = req.body;
    const { id } = req.params;
    
    const allowedRoles = ['admin', 'super_admin', 'pending', 'setiausaha', 'bendahari', 'ajk_peralatan', 'public', 'pengerusi', 'timbalan_pengerusi'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Peranan tidak sah.' });
    }

    if (role === 'super_admin' && req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Hanya Super Admin boleh menetapkan peranan ini.' });
    }

    const targetUser = await db.get('SELECT role FROM users WHERE id = ?', [id]);
    if (targetUser?.role === 'super_admin' && req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Anda tidak boleh mengubah peranan Super Admin.' });
    }
    
    await db.run('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Add new user manually (Admin only)
router.post('/admin/users', verifyToken, verifyRole(['pengerusi']), async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Sila lengkapkan semua maklumat.' });
    }

    if (role === 'super_admin' && req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Hanya Super Admin boleh menambah Super Admin baru.' });
    }

    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Emel ini telah didaftarkan.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const id = randomUUID();
    
    await db.run(
      'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [id, name, email, hash, role]
    );

    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.delete('/admin/users/:id', verifyToken, verifySuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const userId = req.params.id;

    if (req.user?.id === userId) {
      return res.status(400).json({ error: 'Anda tidak boleh memadam akaun anda sendiri.' });
    }

    await db.run('DELETE FROM users WHERE id = ?', [userId]);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});
// --- Events API ---
router.post('/admin/events', verifyToken, verifyRole(['setiausaha', 'penolong_setiausaha', 'pengerusi', 'super_admin']), async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const { title, description, image_url, event_date, venue } = req.body;
    
    if (!title || !event_date) {
      return res.status(400).json({ error: 'Tajuk dan tarikh diperlukan.' });
    }

    const id = randomUUID();
    const modifiedBy = req.user?.name || 'Sistem';
    await db.run(
      'INSERT INTO events (id, title, description, image_url, event_date, venue, last_modified_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, title, description || null, image_url || null, event_date, venue || null, modifiedBy]
    );

    res.status(201).json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.put('/admin/events/:id', verifyToken, verifyRole(['setiausaha', 'penolong_setiausaha', 'pengerusi', 'super_admin']), async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const { title, description, image_url, event_date, venue, status } = req.body;
    const modifiedBy = req.user?.name || 'Sistem';
    
    await db.run(
      'UPDATE events SET title = ?, description = ?, image_url = ?, event_date = ?, venue = ?, status = ?, last_modified_by = ? WHERE id = ?',
      [title, description || null, image_url || null, event_date, venue || null, status || 'published', modifiedBy, id]
    );

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.delete('/admin/events/:id', verifyToken, verifyRole(['setiausaha', 'penolong_setiausaha', 'pengerusi', 'super_admin']), async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    
    await db.run('DELETE FROM events WHERE id = ?', [id]);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post('/events/:id/join', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const eventId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Pengguna tidak disahkan.' });
    }

    const id = randomUUID();
    await db.run(
      'INSERT INTO event_participants (id, event_id, user_id) VALUES (?, ?, ?)',
      [id, eventId, userId]
    );

    res.status(201).json({ success: true });
  } catch (err: any) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Anda sudah mendaftar untuk aktiviti ini.' });
    }
    console.error('JOIN EVENT ERROR:', err);
    res.status(500).json({ error: 'Ralat pelayan.' });
  }
});

router.get('/admin/events/:id/participants', verifyToken, verifyRole(['setiausaha', 'super_admin', 'pengerusi', 'timbalan_pengerusi']), async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const eventId = req.params.id;
    
    const rows = await db.all(`
      SELECT p.id, u.name, u.email, p.created_at
      FROM event_participants p
      JOIN users u ON p.user_id = u.id
      WHERE p.event_id = ?
      ORDER BY p.created_at DESC
    `, [eventId]);
    
    res.status(200).json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Ralat pelayan.' });
  }
});

// --- Receipts API ---
router.post('/admin/finance/receipt', verifyToken, verifyRole(['bendahari', 'super_admin']), memoryUpload.single('receipt'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Tiada fail dimuat naik.' });
    }
    const db = await getDb();
    const id = randomUUID();
    
    await db.run(
      'INSERT INTO receipts (id, file_name, mime_type, data) VALUES (?, ?, ?, ?)',
      [id, req.file.originalname, req.file.mimetype, req.file.buffer]
    );
    
    res.status(201).json({ url: `/api/v1/public/receipts/${id}` });
  } catch (err) {
    console.error('Error uploading receipt:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/public/receipts/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const row = await db.get('SELECT file_name, mime_type, data FROM receipts WHERE id = ?', [req.params.id]);
    
    if (!row) {
      return res.status(404).send('Not found');
    }
    
    res.setHeader('Content-Type', row.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${row.file_name}"`);
    res.send(row.data);
  } catch (err) {
    console.error('Error getting receipt:', err);
    res.status(500).send('Server Error');
  }
});

// --- Finance API (Bendahari) ---
router.get('/admin/finance/transactions', verifyToken, verifyRole(['bendahari', 'penolong_bendahari', 'setiausaha', 'penolong_setiausaha', 'pengerusi', 'timbalan_pengerusi', 'ajk_peralatan', 'super_admin']), async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const rows = await db.all(`
      SELECT t.*, a.name as account_name 
      FROM transactions t 
      JOIN accounts a ON t.account_code = a.code 
      ORDER BY t.created_at DESC
    `);
    const accounts = await db.all('SELECT * FROM accounts');
    res.status(200).json({ data: rows, accounts });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post('/admin/finance/transactions', verifyToken, verifyRole(['bendahari', 'penolong_bendahari', 'pengerusi', 'super_admin']), async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const { account_code, amount, type, description, payment_method, category, receipt_url } = req.body;
    
    if (!account_code || !amount || !type) {
      return res.status(400).json({ error: 'Sila lengkapkan maklumat transaksi.' });
    }

    const id = randomUUID();
    const modifiedBy = req.user?.name || 'Sistem';
    await db.run(
      'INSERT INTO transactions (id, account_code, amount, type, payment_method, category, description, status, receipt_url, last_modified_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, account_code, amount, type, payment_method || 'lain-lain', category || 'lain-lain', description, 'completed', receipt_url || null, modifiedBy]
    );

    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.delete('/admin/finance/transactions/:id', verifyToken, verifyRole(['bendahari', 'penolong_bendahari', 'pengerusi', 'super_admin']), async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    await db.run('DELETE FROM transactions WHERE id = ?', [id]);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// --- Logistics / Inventory API (AJK Peralatan) ---
router.get('/admin/inventory', verifyToken, verifyRole(['bendahari', 'penolong_bendahari', 'setiausaha', 'penolong_setiausaha', 'ajk_peralatan', 'pengerusi', 'timbalan_pengerusi', 'super_admin']), async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM inventory ORDER BY updated_at DESC');
    res.status(200).json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post('/admin/inventory', verifyToken, verifyRole(['ajk_peralatan', 'pengerusi', 'super_admin']), async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const { item_name, quantity, condition, notes } = req.body;

    if (!item_name || quantity === undefined) {
      return res.status(400).json({ error: 'Nama dan kuantiti diperlukan.' });
    }

    const id = randomUUID();
    const modifiedBy = req.user?.name || 'Sistem';
    await db.run(
      'INSERT INTO inventory (id, item_name, quantity, condition, notes, updated_at, last_modified_by) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)',
      [id, item_name, quantity, condition || 'baik', notes || null, modifiedBy]
    );

    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.put('/admin/inventory/:id', verifyToken, verifyRole(['ajk_peralatan', 'pengerusi', 'super_admin']), async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const { item_name, quantity, condition, notes } = req.body;
    const modifiedBy = req.user?.name || 'Sistem';

    await db.run(
      'UPDATE inventory SET item_name = ?, quantity = ?, condition = ?, notes = ?, updated_at = CURRENT_TIMESTAMP, last_modified_by = ? WHERE id = ?',
      [item_name, quantity, condition || 'baik', notes || null, modifiedBy, id]
    );

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.delete('/admin/inventory/:id', verifyToken, verifyRole(['ajk_peralatan', 'pengerusi', 'super_admin']), async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    await db.run('DELETE FROM inventory WHERE id = ?', [id]);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// --- Inventory Loans API ---
router.get('/admin/inventory/loans', verifyToken, verifyRole(['ajk_peralatan', 'super_admin', 'pengerusi']), async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const rows = await db.all(`
      SELECT il.*, i.item_name 
      FROM inventory_loans il 
      JOIN inventory i ON il.inventory_id = i.id 
      ORDER BY il.borrow_date DESC
    `);
    res.status(200).json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.post('/admin/inventory/loans', verifyToken, verifyRole(['ajk_peralatan', 'pengerusi', 'super_admin']), async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const { inventory_id, borrower_name, borrower_phone, quantity } = req.body;
    
    if (!inventory_id || !borrower_name || !quantity) {
      return res.status(400).json({ error: 'Sila lengkapkan maklumat pinjaman.' });
    }

    const id = randomUUID();
    await db.run(
      'INSERT INTO inventory_loans (id, inventory_id, borrower_name, borrower_phone, quantity) VALUES (?, ?, ?, ?, ?)',
      [id, inventory_id, borrower_name, borrower_phone || null, Number(quantity)]
    );

    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.put('/admin/inventory/loans/:id/return', verifyToken, verifyRole(['ajk_peralatan', 'pengerusi', 'super_admin']), async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    
    await db.run(
      'UPDATE inventory_loans SET status = ?, return_date = CURRENT_TIMESTAMP WHERE id = ?',
      ['dipulangkan', id]
    );

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.use('/api/v1', router);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Serve frontend SPA
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

const fs = require('fs');
app.get('/aktiviti', async (req, res, next) => {
  const eventId = req.query.id;
  if (!eventId) {
    return next();
  }
  
  try {
    const { getDb } = require('./db');
    const db = await getDb();
    const event = await db.get('SELECT * FROM events WHERE id = ?', [eventId]);
    if (!event) return next();
    
    const indexPath = path.join(__dirname, '../../frontend/dist/index.html');
    let html = fs.readFileSync(indexPath, 'utf8');
    
    const imageUrl = `${req.protocol}://${req.get('host')}/api/v1/public/events/${eventId}/image`;
    const eventUrl = `${req.protocol}://${req.get('host')}/aktiviti?id=${eventId}`;
    
    const ogTags = `
      <meta property="og:title" content="${event.title}" />
      <meta property="og:description" content="${event.description || 'Sertai aktiviti ini di Masjid Al-Hadhari!'}" />
      <meta property="og:image" content="${imageUrl}" />
      <meta property="og:url" content="${eventUrl}" />
      <meta property="og:type" content="website" />
    `;
    
    html = html.replace('</head>', `${ogTags}</head>`);
    res.send(html);
  } catch (err) {
    next();
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
