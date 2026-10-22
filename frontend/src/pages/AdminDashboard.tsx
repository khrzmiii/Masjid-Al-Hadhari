import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, Calendar as CalendarIcon, Settings, Home, Menu, X, Wallet, Package, TrendingUp, TrendingDown, DollarSign, Trash2, FileText, Banknote, CreditCard, Layers, Phone, Edit2, Check, User, Eye, Award, CheckCircle, Mail } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AdminDashboard.css';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
  avatar_url?: string;
  auth_provider?: string;
  email_verified?: boolean;
  role: string;
  created_at: string;
}

interface EventData {
  id?: string;
  title: string;
  description: string;
  image_url: string;
  event_date: string;
  venue: string;
  updated_by?: string;
}

interface TransactionData {
  id?: string;
  account_code: string;
  account_name?: string;
  amount: number;
  type: string;
  payment_method?: string;
  category?: string;
  description: string;
  status?: string;
  receipt_url?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
}

interface AccountData {
  code: string;
  name: string;
  type: string;
}

interface InventoryData {
  id?: string;
  item_name: string;
  quantity: number;
  condition: string;
  notes: string;
  updated_at?: string;
  updated_by?: string;
}

interface InventoryLoanData {
  id?: string;
  inventory_id: string;
  item_name?: string;
  borrower_name: string;
  borrower_phone: string;
  quantity: number;
  borrow_date?: string;
  return_date?: string;
  status?: string;
  updated_by?: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    const userStr = localStorage.getItem('adminUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'super_admin') return 'users';
        if (user.role === 'setiausaha' || user.role === 'pengerusi' || user.role === 'timbalan_pengerusi') return 'events';
        if (user.role === 'bendahari') return 'finance';
        if (user.role === 'ajk_peralatan') return 'logistics';
      } catch (e) {
        // ignore
      }
    }
    return 'settings';
  });
  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', phone_number: '', password: '', role: 'public' });
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingPhoneUserId, setEditingPhoneUserId] = useState<string | null>(null);
  const [editPhoneValue, setEditPhoneValue] = useState<string>('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<UserData | null>(null);
  const [selectedUserEvents, setSelectedUserEvents] = useState<any[]>([]);
  const [loadingUserEvents, setLoadingUserEvents] = useState(false);
  const [eventsList, setEventsList] = useState<EventData[]>([]);
  
  const [transactionsList, setTransactionsList] = useState<TransactionData[]>([]);
  const [financeTypeFilter, setFinanceTypeFilter] = useState<string>('Semua');
  const [financeCategoryFilter, setFinanceCategoryFilter] = useState<string>('Semua');
  const [financeMethodFilter, setFinanceMethodFilter] = useState<string>('Semua');
  const [bakiMode, setBakiMode] = useState<'all' | 'cash' | 'online'>('all');
  const [exportMonthKewangan, setExportMonthKewangan] = useState<string>('');
  const [exportMonthAktiviti, setExportMonthAktiviti] = useState<string>('');
  const [exportMonthLogistik, setExportMonthLogistik] = useState<string>('');
  const [accountsList, setAccountsList] = useState<AccountData[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryData[]>([]);
  
  const [loading, setLoading] = useState(false);
  
  const [newEvent, setNewEvent] = useState<EventData>({
    title: '', description: '', image_url: '', event_date: '', venue: ''
  });
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [participantsList, setParticipantsList] = useState<any[]>([]);
  const [selectedEventForParticipants, setSelectedEventForParticipants] = useState<EventData | null>(null);
  
  const [newTransaction, setNewTransaction] = useState<TransactionData>({
    account_code: 'BANK', amount: 0, type: 'income', description: '', payment_method: 'Atas Talian', category: 'Lain-lain'
  });
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptModalUrl, setReceiptModalUrl] = useState<string | null>(null);

  const [newItem, setNewItem] = useState<InventoryData>({
    item_name: '', quantity: 1, condition: 'baik', notes: ''
  });
  const [editingInventoryId, setEditingInventoryId] = useState<string | null>(null);
  
  const [loansList, setLoansList] = useState<InventoryLoanData[]>([]);
  const [borrowForm, setBorrowForm] = useState<InventoryLoanData>({
    inventory_id: '', borrower_name: '', borrower_phone: '', quantity: 1
  });
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const token = localStorage.getItem('adminToken');
  const userStr = localStorage.getItem('adminUser');
  const user = userStr ? JSON.parse(userStr) : null;

  const canEditUsers = user?.role === 'pengerusi' || user?.role === 'super_admin';
  const canEditFinance = user?.role === 'bendahari' || user?.role === 'penolong_bendahari' || user?.role === 'pengerusi' || user?.role === 'super_admin';
  const canEditEvents = user?.role === 'setiausaha' || user?.role === 'penolong_setiausaha' || user?.role === 'pengerusi' || user?.role === 'super_admin';
  const canEditInventory = user?.role === 'ajk_peralatan' || user?.role === 'pengerusi' || user?.role === 'super_admin';

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    
    if (user?.role === 'public' || user?.role === 'pending') {
      navigate('/profil');
      return;
    }

    if (activeTab === 'users' && (user?.role === 'super_admin' || user?.role === 'pengerusi')) {
      fetchUsers();
    } else if (activeTab === 'events' && (user?.role === 'super_admin' || user?.role === 'setiausaha' || user?.role === 'penolong_setiausaha' || user?.role === 'pengerusi' || user?.role === 'timbalan_pengerusi')) {
      fetchAdminEvents();
    } else if (activeTab === 'finance' && (user?.role === 'super_admin' || user?.role === 'bendahari' || user?.role === 'penolong_bendahari' || user?.role === 'pengerusi' || user?.role === 'timbalan_pengerusi')) {
      fetchFinanceData();
    } else if (activeTab === 'logistics' && (user?.role === 'super_admin' || user?.role === 'ajk_peralatan' || user?.role === 'pengerusi' || user?.role === 'timbalan_pengerusi')) {
      fetchInventoryData();
    } else {
      setLoading(false);
    }
  }, [token, navigate, activeTab, user?.role]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const json = await response.json();
        setUsersList(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUserDetails = async (u: UserData) => {
    setSelectedUserForDetails(u);
    setSelectedUserEvents([]);
    setLoadingUserEvents(true);
    try {
      const response = await fetch(`/api/v1/admin/users/${u.id}/events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const json = await response.json();
        setSelectedUserEvents(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch user events', err);
    } finally {
      setLoadingUserEvents(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUserForm)
      });
      if (response.ok) {
        alert('Pengguna berjaya ditambah.');
        setIsAddingUser(false);
        setNewUserForm({ name: '', email: '', phone_number: '', password: '', role: 'public' });
        fetchUsers();
      } else {
        const err = await response.json();
        alert(err.error || 'Gagal menambah pengguna.');
      }
    } catch (err) {
      alert('Ralat pelayan.');
    }
  };

  const handleSavePhone = async (id: string) => {
    setSavingPhone(true);
    try {
      const response = await fetch(`/api/v1/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phone_number: editPhoneValue })
      });
      if (response.ok) {
        setEditingPhoneUserId(null);
        fetchUsers();
      } else {
        const err = await response.json();
        alert(err.error || 'Gagal mengemas kini nombor telefon.');
      }
    } catch (err) {
      alert('Ralat pelayan.');
    } finally {
      setSavingPhone(false);
    }
  };

  const fetchAdminEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/public/events');
      if (response.ok) {
        const json = await response.json();
        setEventsList(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch events', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalImageUrl = newEvent.image_url;
      
      if (selectedImageFile) {
        const formData = new FormData();
        formData.append('image', selectedImageFile);
        
        const uploadRes = await fetch('/api/v1/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalImageUrl = uploadData.url;
        } else {
          const errText = await uploadRes.text();
          alert('Gagal memuat naik gambar. Ralat: ' + errText);
          return;
        }
      }

      const url = editingEventId 
        ? `/api/v1/admin/events/${editingEventId}`
        : '/api/v1/admin/events';
      const method = editingEventId ? 'PUT' : 'POST';

      let isoEventDate = newEvent.event_date;
      try {
        isoEventDate = new Date(newEvent.event_date).toISOString();
      } catch (e) {}

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...newEvent, image_url: finalImageUrl, event_date: isoEventDate })
      });
      if (response.ok) {
        fetchAdminEvents();
        setNewEvent({ title: '', description: '', image_url: '', event_date: '', venue: '' });
        setSelectedImageFile(null);
        setEditingEventId(null);
        alert(editingEventId ? 'Aktiviti berjaya disunting.' : 'Aktiviti berjaya ditambah.');
      } else {
        const errText = await response.text();
        let errMsg = errText;
        try { const errJson = JSON.parse(errText); errMsg = errJson.error || errText; } catch(e) {}
        alert(`Gagal menyimpan aktiviti (Status ${response.status}): ${errMsg}`);
      }
    } catch (err) {
      alert('Ralat pelayan.');
    }
  };

  const handleEditEventClick = (ev: EventData) => {
    let localDateTime = ev.event_date;
    try {
      const dateObj = new Date(ev.event_date);
      const pad = (n: number) => n.toString().padStart(2, '0');
      localDateTime = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
    } catch (e) {}
    
    setNewEvent({ ...ev, event_date: localDateTime });
    setEditingEventId(ev.id || null);
    setSelectedImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchParticipants = async (ev: EventData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/v1/admin/events/${ev.id}/participants`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const json = await response.json();
        setParticipantsList(json.data || []);
        setSelectedEventForParticipants(ev);
        setIsParticipantsModalOpen(true);
      } else {
        alert('Gagal mengambil senarai peserta.');
      }
    } catch (err) {
      alert('Ralat pelayan.');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Padam aktiviti ini?')) return;
    try {
      const response = await fetch(`/api/v1/admin/events/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchAdminEvents();
      }
    } catch (err) {
      alert('Ralat pelayan.');
    }
  };

  const fetchFinanceData = async () => {
    try {
      const response = await fetch('/api/v1/admin/finance/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const json = await response.json();
        setTransactionsList(json.data || []);
        setAccountsList(json.accounts || []);
      }
    } catch (err) {
      console.error('Failed to fetch finance', err);
    }
  };

  const isCashTransaction = (t: Partial<TransactionData>) => {
    if (t.account_code === 'TUNAI') return true;
    if (t.account_code === 'BANK') return false;
    const pm = (t.payment_method || '').trim().toLowerCase();
    return pm === 'tunai' || pm === 'cash';
  };

  const isOnlineTransaction = (t: Partial<TransactionData>) => {
    return !isCashTransaction(t);
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const numAmount = Number(newTransaction.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        alert('Sila masukkan amaun transaksi yang sah (lebih daripada RM 0.00).');
        return;
      }

      // Pre-check for expense: ensure masjid has sufficient balance
      if (newTransaction.type === 'expense') {
        const remainingTxs = editingTransactionId
          ? transactionsList.filter(t => t.id !== editingTransactionId)
          : transactionsList;

        const availCash = remainingTxs
          .filter(t => t.type === 'income' && isCashTransaction(t))
          .reduce((sum, t) => sum + Number(t.amount || 0), 0) -
          remainingTxs
          .filter(t => t.type === 'expense' && isCashTransaction(t))
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const availOnline = remainingTxs
          .filter(t => t.type === 'income' && isOnlineTransaction(t))
          .reduce((sum, t) => sum + Number(t.amount || 0), 0) -
          remainingTxs
          .filter(t => t.type === 'expense' && isOnlineTransaction(t))
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const availTotal = availCash + availOnline;
        const isSpendingCash = isCashTransaction(newTransaction);

        if (isSpendingCash && numAmount > availCash) {
          alert(`Transaksi Ditolak!\n\nAmaun perbelanjaan tunai (RM ${numAmount.toFixed(2)}) melebihi baki tunai semasa yang ada (RM ${Math.max(0, availCash).toFixed(2)}).\n\nSila pastikan baki tunai mencukupi sebelum merekod perbelanjaan.`);
          return;
        }

        if (!isSpendingCash && numAmount > availOnline) {
          alert(`Transaksi Ditolak!\n\nAmaun perbelanjaan bank/atas talian (RM ${numAmount.toFixed(2)}) melebihi baki bank semasa yang ada (RM ${Math.max(0, availOnline).toFixed(2)}).\n\nSila pastikan baki bank mencukupi sebelum merekod perbelanjaan.`);
          return;
        }

        if (numAmount > availTotal) {
          alert(`Transaksi Ditolak!\n\nAmaun perbelanjaan (RM ${numAmount.toFixed(2)}) melebihi jumlah baki keseluruhan tabung masjid (RM ${Math.max(0, availTotal).toFixed(2)}).`);
          return;
        }
      }

      let finalReceiptUrl = newTransaction.receipt_url;

      if (receiptFile) {
        const formData = new FormData();
        formData.append('receipt', receiptFile);
        
        const uploadRes = await fetch('/api/v1/admin/finance/receipt', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalReceiptUrl = uploadData.url;
        } else {
          const errText = await uploadRes.text();
          alert('Gagal memuat naik resit. Ralat: ' + errText);
          return;
        }
      }

      const url = editingTransactionId ? `/api/v1/admin/finance/transactions/${editingTransactionId}` : '/api/v1/admin/finance/transactions';
      const method = editingTransactionId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...newTransaction, amount: numAmount, receipt_url: finalReceiptUrl })
      });

      if (response.ok) {
        fetchFinanceData();
        setNewTransaction({ account_code: 'BANK', amount: 0, type: 'income', description: '', payment_method: 'Atas Talian', category: 'Lain-lain' });
        setEditingTransactionId(null);
        setReceiptFile(null);
        alert(editingTransactionId ? 'Transaksi berjaya dikemaskini.' : 'Transaksi berjaya ditambah.');
      } else {
        const errData = await response.json().catch(() => null);
        alert(errData?.error || 'Gagal menyimpan transaksi.');
      }
    } catch (err) {
      alert('Ralat pelayan.');
    }
  };

  const handleEditTransactionClick = (t: TransactionData) => {
    setEditingTransactionId(t.id!);
    const acc = t.account_code || (t.payment_method === 'Tunai' ? 'TUNAI' : 'BANK');
    const pm = acc === 'TUNAI' ? 'Tunai' : (t.payment_method === 'Tunai' ? 'Atas Talian' : (t.payment_method || 'Atas Talian'));
    setNewTransaction({
      account_code: acc,
      amount: t.amount,
      type: t.type,
      description: t.description,
      payment_method: pm,
      category: t.category || 'Lain-lain',
      receipt_url: t.receipt_url
    });
    setReceiptFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('Batalkan transaksi ini?')) return;
    try {
      const response = await fetch(`/api/v1/admin/finance/transactions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchFinanceData();
        alert('Transaksi berjaya dipadam.');
      } else {
        const errData = await response.json().catch(() => null);
        alert(errData?.error || 'Gagal memadam transaksi.');
      }
    } catch (err) {
      alert('Ralat pelayan.');
    }
  };

  const fetchInventoryData = async () => {
    try {
      const response = await fetch('/api/v1/admin/inventory', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const json = await response.json();
        setInventoryList(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch inventory', err);
    }
    fetchLoansData();
  };

  const fetchLoansData = async () => {
    try {
      const response = await fetch('/api/v1/admin/inventory/loans', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const json = await response.json();
        setLoansList(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch loans', err);
    }
  };

  const handleBorrowItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/v1/admin/inventory/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(borrowForm)
      });
      if (response.ok) {
        fetchLoansData();
        setBorrowForm({ inventory_id: '', borrower_name: '', borrower_phone: '', quantity: 1 });
        setIsBorrowModalOpen(false);
        alert('Rekod pinjaman berjaya disimpan.');
      } else {
        const errText = await response.text();
        let errMsg = errText;
        try { const errJson = JSON.parse(errText); errMsg = errJson.error || errText; } catch(e) {}
        alert(`Gagal menyimpan rekod pinjaman (Status ${response.status}): ${errMsg}`);
      }
    } catch (err) {
      alert('Ralat pelayan.');
    }
  };

  const handleReturnItem = async (id: string) => {
    if (!window.confirm('Mengesahkan barang telah dipulangkan?')) return;
    try {
      const response = await fetch(`/api/v1/admin/inventory/loans/${id}/return`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchLoansData();
      }
    } catch (err) {
      alert('Ralat pelayan.');
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingInventoryId) {
        const response = await fetch(`/api/v1/admin/inventory/${editingInventoryId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(newItem)
        });
        if (response.ok) {
          fetchInventoryData();
          setNewItem({ item_name: '', quantity: 1, condition: 'baik', notes: '' });
          setEditingInventoryId(null);
        } else {
          alert('Gagal mengemas kini peralatan.');
        }
      } else {
        const response = await fetch('/api/v1/admin/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(newItem)
        });
        if (response.ok) {
          fetchInventoryData();
          setNewItem({ item_name: '', quantity: 1, condition: 'baik', notes: '' });
        } else {
          alert('Gagal menambah peralatan.');
        }
      }
    } catch (err) {
      alert('Ralat pelayan.');
    }
  };

  const handleEditItemClick = (item: InventoryData) => {
    setEditingInventoryId(item.id!);
    setNewItem({
      item_name: item.item_name,
      quantity: item.quantity,
      condition: item.condition,
      notes: item.notes || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Padam barang ini?')) return;
    try {
      const response = await fetch(`/api/v1/admin/inventory/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) fetchInventoryData();
    } catch (err) {
      alert('Ralat pelayan.');
    }
  };

  const handleRoleUpdate = async (id: string, newRole: string) => {
    try {
      const response = await fetch(`/api/v1/admin/users/${id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (response.ok) {
        fetchUsers(); // Refresh the list
      } else {
        alert('Gagal mengemas kini peranan.');
      }
    } catch (err) {
      alert('Ralat pelayan.');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Adakah anda pasti mahu memadam akaun pengguna ${name}? Tindakan ini tidak boleh diundur.`)) return;
    try {
      const response = await fetch(`/api/v1/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error || 'Gagal memadam pengguna.');
      }
    } catch (err) {
      alert('Ralat pelayan.');
    }
  };

  const handleExportPDF = async (moduleName: 'kewangan' | 'aktiviti' | 'logistik') => {
    // Landscape orientation
    const doc = new jsPDF('landscape');
    
    // Add title
    const title = `LAPORAN ${moduleName.toUpperCase()}`;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const textWidth = doc.getTextWidth(title);
    const x = (pageWidth - textWidth) / 2;
    
    doc.text(title, x, 20);
    
    // Underline
    doc.setLineWidth(0.5);
    doc.line(x, 21, x + textWidth, 21);

    const tableOptions = {
      startY: 30,
      theme: 'grid' as const,
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 4,
        fillColor: [255, 255, 255] as [number, number, number],
        textColor: [0, 0, 0] as [number, number, number],
        lineColor: [0, 0, 0] as [number, number, number],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [255, 255, 0] as [number, number, number],
        textColor: [0, 0, 0] as [number, number, number],
        fontStyle: 'bold' as const,
        halign: 'center' as const,
      },
      bodyStyles: {
        halign: 'left' as const,
      },
      margin: { bottom: 30 } // Leave space for footer
    };

    let head: string[][] = [];
    let body: string[][] = [];

    if (moduleName === 'kewangan') {
      head = [['Tarikh', 'Akaun', 'Penerangan', 'Kategori', 'Kaedah', 'Jenis', 'Jumlah (RM)']];
      const filteredForPDF = exportMonthKewangan 
        ? filteredTransactions.filter(t => t.created_at?.startsWith(exportMonthKewangan))
        : filteredTransactions;
        
      body = filteredForPDF.map(t => [
        new Date(t.created_at!).toLocaleDateString('ms-MY'),
        t.account_name || t.account_code,
        t.description || '-',
        t.category || '-',
        t.payment_method || '-',
        t.type === 'income' ? 'Duit Masuk' : 'Duit Keluar',
        Number(t.amount).toFixed(2)
      ]);
    } else if (moduleName === 'aktiviti') {
      head = [['Tarikh & Masa', 'Tajuk Aktiviti', 'Lokasi']];
      const filteredForPDF = exportMonthAktiviti 
        ? eventsList.filter(e => e.event_date.startsWith(exportMonthAktiviti))
        : eventsList;
        
      body = filteredForPDF.map(e => [
        new Date(e.event_date).toLocaleString('ms-MY'),
        e.title,
        e.venue || '-'
      ]);
    } else if (moduleName === 'logistik') {
      head = [['Nama Barang', 'Kuantiti', 'Status Pinjaman', 'Keadaan', 'Catatan', 'Dikemaskini']];
      const filteredForPDF = exportMonthLogistik
        ? inventoryList.filter(i => i.updated_at?.startsWith(exportMonthLogistik))
        : inventoryList;
        
      body = filteredForPDF.map(i => [
        i.item_name,
        i.quantity.toString(),
        '', // Placeholder for logic status
        i.condition,
        i.notes || '-',
        new Date(i.updated_at!).toLocaleDateString('ms-MY')
      ]);
    }

    if (body.length === 0) {
      alert(`Tiada rekod ditemui untuk dieksport.`);
      return;
    }

    autoTable(doc, {
      ...tableOptions,
      head,
      body
    });
    
    let finalY = (doc as any).lastAutoTable.finalY || 50;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setPage(pageCount);
    const signatureY = pageHeight - 40;
    
    let currentUsersList = usersList;
    if (currentUsersList.length === 0) {
      try {
        const response = await fetch('/api/v1/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const json = await response.json();
          currentUsersList = json.data || [];
          setUsersList(currentUsersList);
        }
      } catch (err) {
        console.error('Failed to fetch users for PDF signature', err);
      }
    }
    
    // Right Signature (Pengerusi)
    const pengerusi = currentUsersList.find(u => u.role === 'pengerusi');
    const pengerusiName = pengerusi ? pengerusi.name.toUpperCase() : '';
    const pengerusiRole = 'PENGERUSI MASJID AL-HADHARI, KG. MASOLOG';
    
    const rightMaxWidth = Math.max(doc.getTextWidth(pengerusiName), doc.getTextWidth(pengerusiRole));
    let pengerusiDots = '........................................';
    while (doc.getTextWidth(pengerusiDots) < rightMaxWidth) {
      pengerusiDots += '.';
    }
    
    const rightX = pageWidth - 14 - doc.getTextWidth(pengerusiDots);
    
    doc.text(pengerusiDots, rightX, signatureY);
    if (pengerusiName) doc.text(pengerusiName, rightX, signatureY + 5);
    doc.text(pengerusiRole, rightX, signatureY + 10);

    // Left Signature (PIC)
    let leftUser;
    let leftRole = '';
    
    if (moduleName === 'kewangan') {
      leftUser = currentUsersList.find(u => u.role === 'bendahari');
      leftRole = 'BENDAHARI MASJID AL-HADHARI';
    } else if (moduleName === 'aktiviti') {
      leftUser = currentUsersList.find(u => u.role === 'setiausaha');
      leftRole = 'SETIAUSAHA MASJID AL-HADHARI';
    } else if (moduleName === 'logistik') {
      leftUser = currentUsersList.find(u => u.role === 'ajk_peralatan');
      leftRole = 'AJK LOGISTIK MASJID AL-HADHARI';
    }

    const leftName = leftUser ? leftUser.name.toUpperCase() : '';
    
    const leftMaxWidth = Math.max(doc.getTextWidth(leftName), doc.getTextWidth(leftRole));
    let leftDots = '........................................';
    while (doc.getTextWidth(leftDots) < leftMaxWidth) {
      leftDots += '.';
    }
    
    doc.text(leftDots, 14, signatureY);
    if (leftName) doc.text(leftName, 14, signatureY + 5);
    doc.text(leftRole, 14, signatureY + 10);

    // Time stamp (Absolute Footer on all pages)
    const timeStamp = `Dicetak pada: ${new Date().toLocaleString('ms-MY')}`;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(timeStamp, 14, pageHeight - 10);
    }

    doc.save(`Laporan_${moduleName}.pdf`);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/login');
  };

  const filteredTransactions = transactionsList.filter(t => {
    if (financeTypeFilter !== 'Semua' && t.type !== financeTypeFilter) return false;
    if (financeCategoryFilter !== 'Semua' && t.category !== financeCategoryFilter) return false;
    if (financeMethodFilter !== 'Semua' && t.payment_method !== financeMethodFilter) return false;
    return true;
  });



  const cashIncome = transactionsList.filter(t => t.type === 'income' && isCashTransaction(t)).reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const cashExpense = transactionsList.filter(t => t.type === 'expense' && isCashTransaction(t)).reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const cashBalance = cashIncome - cashExpense;

  const onlineIncome = transactionsList.filter(t => t.type === 'income' && isOnlineTransaction(t)).reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const onlineExpense = transactionsList.filter(t => t.type === 'expense' && isOnlineTransaction(t)).reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const onlineBalance = onlineIncome - onlineExpense;

  const totalIncome = transactionsList.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalExpense = transactionsList.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalBalance = totalIncome - totalExpense;

  const currentIncome = bakiMode === 'all' ? totalIncome : bakiMode === 'cash' ? cashIncome : onlineIncome;
  const currentExpense = bakiMode === 'all' ? totalExpense : bakiMode === 'cash' ? cashExpense : onlineExpense;
  const currentBalance = bakiMode === 'all' ? totalBalance : bakiMode === 'cash' ? cashBalance : onlineBalance;

  const hasPengerusi = usersList.some(u => u.role === 'pengerusi');
  const hasTimbalan = usersList.some(u => u.role === 'timbalan_pengerusi');
  const hasSetiausaha = usersList.some(u => u.role === 'setiausaha');
  const hasBendahari = usersList.some(u => u.role === 'bendahari');

  const renderRoleOptions = (currentRole?: string) => (
    <>
      <option value="pending">Belum Disahkan (Pending)</option>
      <option value="public">Awam</option>
      <option value="penaung">Penaung</option>
      <option value="penasihat">Penasihat</option>
      <option value="pengerusi" disabled={hasPengerusi && currentRole !== 'pengerusi'}>Pengerusi {(hasPengerusi && currentRole !== 'pengerusi') ? '(Telah Diisi)' : ''}</option>
      <option value="timbalan_pengerusi" disabled={hasTimbalan && currentRole !== 'timbalan_pengerusi'}>Timbalan Pengerusi {(hasTimbalan && currentRole !== 'timbalan_pengerusi') ? '(Telah Diisi)' : ''}</option>
      <option value="setiausaha" disabled={hasSetiausaha && currentRole !== 'setiausaha'}>Setiausaha {(hasSetiausaha && currentRole !== 'setiausaha') ? '(Telah Diisi)' : ''}</option>
      <option value="penolong_setiausaha">Penolong Setiausaha</option>
      <option value="bendahari" disabled={hasBendahari && currentRole !== 'bendahari'}>Bendahari {(hasBendahari && currentRole !== 'bendahari') ? '(Telah Diisi)' : ''}</option>
      <option value="penolong_bendahari">Penolong Bendahari</option>
      <option value="ajk_dakwah">AJK Dakwah & Pendidikan</option>
      <option value="ajk_kebersihan">AJK Kebersihan & Keceriaan</option>
      <option value="ajk_peralatan">AJK Aset & Peralatan</option>
      <option value="ajk_perkuburan">AJK Taman Perkuburan</option>
      <option value="ajk_kebajikan">AJK Kebajikan & Kemasyarakatan</option>
      <option value="ajk_keselamatan">AJK Keselamatan</option>
      <option value="ajk_pembangunan">AJK Pembangunan & Baik Pulih</option>
      <option value="ajk_kesukarelawan">AJK Kesukarelawan</option>
      <option value="ajk_belia_ekonomi">AJK Belia & Ekonomi</option>
      <option value="ajk_kesenian">AJK Kesenian Islam</option>
      <option value="ajk_penerbitan">AJK Penerbitan & Publisiti</option>
      <option value="ajk_perayaan">AJK Perayaan Islam</option>
      <option value="ajk_muslimah">AJK Hal Ehwal Muslimah</option>
      <option value="ajk_tugas_khas">AJK Tugas-tugas Khas</option>
      <option value="ajk_hal_ehwal_belia">AJK Hal Ehwal Belia</option>
      <option value="ajk_unit_khas">AJK Unit Khas (Kemahiran Hidup)</option>
      <option value="pegawai_dokumentasi">Pegawai Dokumentasi & ICT</option>
      <option value="pegawai_juruaudit_dalaman">Juruaudit Dalaman</option>
      <option value="pegawai_juruaudit_luar">Juruaudit Luar</option>
      <option value="pegawai_sukan">Pegawai Sukan & Riadah</option>
      <option value="imam_rawatib">Imam Rawatib</option>
      <option value="imam_kariah">Imam Kariah</option>
      <option value="ajk_kecil">AJK Kecil / Wakil Kampung</option>
      {user?.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
    </>
  );

  return (
    <div className="admin-layout">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
            <div>
              <h2>Panel Admin</h2>
              <span className="badge">Masjid Al-Hadhari</span>
            </div>
            <button 
              className="sidebar-close-btn" 
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Tutup menu"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className="nav-btn"
            onClick={() => { navigate('/'); setIsSidebarOpen(false); }}
            style={{ color: '#0f172a', backgroundColor: '#f1f5f9', marginBottom: '1rem', fontWeight: 'bold' }}
          >
            <Home size={18} /> Laman Utama
          </button>
          
          {(user?.role === 'super_admin' || user?.role === 'setiausaha' || user?.role === 'pengerusi' || user?.role === 'timbalan_pengerusi') && (
            <button 
              className={`nav-btn ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => { setActiveTab('events'); setIsSidebarOpen(false); }}
            >
              <CalendarIcon size={18} /> Aktiviti
            </button>
          )}

          {(user?.role === 'super_admin' || user?.role === 'bendahari' || user?.role === 'pengerusi' || user?.role === 'timbalan_pengerusi') && (
            <button 
              className={`nav-btn ${activeTab === 'finance' ? 'active' : ''}`}
              onClick={() => { setActiveTab('finance'); setIsSidebarOpen(false); }}
            >
              <Wallet size={18} /> Kewangan
            </button>
          )}

          {(user?.role === 'super_admin' || user?.role === 'ajk_peralatan' || user?.role === 'pengerusi' || user?.role === 'timbalan_pengerusi') && (
            <button 
              className={`nav-btn ${activeTab === 'logistics' ? 'active' : ''}`}
              onClick={() => { setActiveTab('logistics'); setIsSidebarOpen(false); }}
            >
              <Package size={18} /> Logistik
            </button>
          )}

          {(user?.role === 'super_admin' || user?.role === 'pengerusi') && (
            <button 
              className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }}
            >
              <Users size={18} /> Pengguna
            </button>
          )}
          <button 
            className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
          >
            <Settings size={18} /> Tetapan
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <strong>{user?.name}</strong>
            <span>{user?.role}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-header-title-row">
            <button className="mobile-sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1>{activeTab === 'users' ? 'Pengurusan Akses & Pengguna' :
                 activeTab === 'events' ? 'Pengurusan Aktiviti' : 
                 activeTab === 'finance' ? 'Pengurusan Kewangan' : 
                 activeTab === 'logistics' ? 'Pengurusan Logistik' : 'Papan Pemuka'}</h1>
          </div>
        </header>

        <div className="admin-content">          {activeTab === 'users' && (user?.role === 'super_admin' || user?.role === 'pengerusi') && (
            <div className="card-container">
              {isAddingUser ? (
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', marginBottom: '2rem' }}>
                  <h3 style={{ margin: '0 0 1.5rem 0', color: '#0f172a' }}>Tambah Pengguna Baru</h3>
                  <form onSubmit={handleAddUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Nama</label>
                      <input required type="text" value={newUserForm.name} onChange={e => setNewUserForm({...newUserForm, name: e.target.value})} className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Emel</label>
                      <input required type="email" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>No. Telefon</label>
                      <input type="tel" placeholder="Contoh: 0123456789" value={newUserForm.phone_number} onChange={e => setNewUserForm({...newUserForm, phone_number: e.target.value})} className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Kata Laluan</label>
                      <input required type="password" value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Peranan</label>
                      <select value={newUserForm.role} onChange={e => setNewUserForm({...newUserForm, role: e.target.value})} className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}>
                        {renderRoleOptions()}
                      </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                      <button type="button" onClick={() => setIsAddingUser(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', backgroundColor: '#e2e8f0', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>Batal</button>
                      <button type="submit" style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', backgroundColor: 'var(--color-primary)', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Simpan Pengguna</button>
                    </div>
                  </form>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                  <button onClick={() => setIsAddingUser(true)} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', backgroundColor: 'var(--color-primary)', color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={18} /> Tambah Pengguna
                  </button>
                </div>
              )}

              {loading ? (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>Memuatkan senarai pengguna...</p>
              ) : (
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, color: '#0f172a' }}>Senarai Pengguna & Akses</h3>
                    <span style={{ backgroundColor: '#e2e8f0', color: '#475569', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>Jumlah: {usersList.length}</span>
                  </div>
                  <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <table className="data-table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ backgroundColor: '#f8fafc' }}>
                        <tr>
                          <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>Pengguna</th>
                          <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>Emel & Status</th>
                          <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>No. Telefon</th>
                          <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>Tarikh Daftar</th>
                          <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>Peranan & Tindakan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.map((u, index) => (
                          <tr key={u.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                  {u.avatar_url ? (
                                    <img 
                                      src={u.avatar_url} 
                                      alt={u.name} 
                                      style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #10b981', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }} 
                                    />
                                  ) : (
                                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.95rem', border: '2px solid #a7f3d0' }}>
                                      {u.name ? u.name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() : <User size={20} />}
                                    </div>
                                  )}
                                  {u.auth_provider === 'google' && (
                                    <span 
                                      title="Akaun Google"
                                      style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px' }}
                                    >
                                      🌐
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <div 
                                    onClick={() => handleOpenUserDetails(u)}
                                    style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.95rem', cursor: 'pointer', transition: 'color 0.2s' }}
                                    title="Klik untuk maklumat lengkap"
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#059669'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#0f172a'}
                                  >
                                    {u.name}
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.2rem', alignItems: 'center' }}>
                                    <button
                                      onClick={() => handleOpenUserDetails(u)}
                                      style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#059669', fontSize: '0.75rem', fontWeight: '600', padding: '0.15rem 0.5rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', transition: 'all 0.2s' }}
                                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ecfdf5'; e.currentTarget.style.borderColor = '#a7f3d0'; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                    >
                                      <Eye size={12} />
                                      <span>Maklumat Lengkap</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '1rem', color: '#334155' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <span style={{ fontWeight: '500', color: '#0f172a' }}>{u.email}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                                  {u.email_verified ? (
                                    <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: '600' }}>
                                      <CheckCircle size={12} /> Disahkan
                                    </span>
                                  ) : (
                                    <span style={{ color: '#ca8a04', fontWeight: '500' }}>
                                      Belum Disahkan
                                    </span>
                                  )}
                                  <span style={{ color: '#cbd5e1' }}>•</span>
                                  <span style={{ color: '#64748b' }}>
                                    {u.auth_provider === 'google' ? 'Google' : 'Emel Biasa'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '1rem', color: '#334155' }}>
                              {editingPhoneUserId === u.id ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <input
                                    type="tel"
                                    value={editPhoneValue}
                                    onChange={(e) => setEditPhoneValue(e.target.value)}
                                    placeholder="0123456789"
                                    style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #059669', fontSize: '0.875rem', width: '130px', outline: 'none' }}
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSavePhone(u.id);
                                      if (e.key === 'Escape') setEditingPhoneUserId(null);
                                    }}
                                  />
                                  <button 
                                    onClick={() => handleSavePhone(u.id)}
                                    disabled={savingPhone}
                                    style={{ background: '#059669', color: 'white', border: 'none', borderRadius: '6px', padding: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                    title="Simpan"
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button 
                                    onClick={() => setEditingPhoneUserId(null)}
                                    style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', padding: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                    title="Batal"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  {u.phone_number ? (
                                    <a 
                                      href={`https://wa.me/6${u.phone_number.replace(/^(+?60|0)/, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: '#059669', textDecoration: 'none', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                                      title="Buka WhatsApp / Panggil"
                                    >
                                      <Phone size={14} />
                                      <span>{u.phone_number}</span>
                                    </a>
                                  ) : (
                                    <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>Tiada</span>
                                  )}
                                  {(user?.role === 'super_admin' || user?.role === 'pengerusi') && (
                                    <button
                                      onClick={() => {
                                        setEditingPhoneUserId(u.id);
                                        setEditPhoneValue(u.phone_number || '');
                                      }}
                                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '4px' }}
                                      title={u.phone_number ? "Kemas kini nombor telefon" : "Tambah nombor telefon"}
                                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                                      onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '1rem', color: '#64748b' }}>{new Date(u.created_at).toLocaleDateString('ms-MY')}</td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {u.name === user?.name ? (
                                  <span className="badge" style={{ backgroundColor: '#e2e8f0', color: '#475569', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}>
                                    {u.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} (Anda)
                                  </span>
                                ) : u.role === 'super_admin' ? (
                                  <span className="badge" style={{ backgroundColor: '#fef08a', color: '#854d0e', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}>Super Admin</span>
                                ) : (
                                  <select 
                                    value={u.role}
                                    onChange={(e) => handleRoleUpdate(u.id, e.target.value)}
                                    style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#0f172a', fontWeight: '500', outline: 'none' }}
                                  >
                                    {renderRoleOptions(u.role)}
                                  </select>
                                )}
                                <button
                                  onClick={() => handleOpenUserDetails(u)}
                                  style={{ padding: '0.5rem', backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  title="Lihat Maklumat Penuh"
                                >
                                  <Eye size={16} />
                                </button>
                                {u.name !== user?.name && (
                                  <button 
                                    onClick={() => handleDeleteUser(u.id, u.name)}
                                    style={{ padding: '0.5rem', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                    title="Padam Pengguna"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Modal Maklumat Lengkap Pengguna */}
              {selectedUserForDetails && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 9999, padding: '1rem'
                }}>
                  <div style={{
                    backgroundColor: 'white', borderRadius: '16px', maxWidth: '650px', width: '100%',
                    maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    border: '1px solid #e2e8f0'
                  }}>
                    {/* Header */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '1.25rem 1.75rem', borderBottom: '1px solid #f1f5f9',
                      backgroundColor: '#f8fafc', borderTopLeftRadius: '16px', borderTopRightRadius: '16px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ background: '#ecfdf5', padding: '0.5rem', borderRadius: '10px' }}>
                          <Users size={20} color="#059669" />
                        </div>
                        <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem', fontWeight: '700' }}>
                          Maklumat Lengkap Pengguna
                        </h3>
                      </div>
                      <button
                        onClick={() => setSelectedUserForDetails(null)}
                        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.4rem', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '1.75rem' }}>
                      {/* Profile Card Header */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem',
                        backgroundColor: '#f0fdf4', borderRadius: '14px', border: '1px solid #bbf7d0',
                        marginBottom: '1.5rem'
                      }}>
                        {selectedUserForDetails.avatar_url ? (
                          <img
                            src={selectedUserForDetails.avatar_url}
                            alt={selectedUserForDetails.name}
                            style={{
                              width: '84px', height: '84px', borderRadius: '50%', objectFit: 'cover',
                              border: '3px solid #059669', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', flexShrink: 0
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '84px', height: '84px', borderRadius: '50%',
                            backgroundColor: '#dcfce7', color: '#059669', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontWeight: '800',
                            fontSize: '1.8rem', border: '3px solid #86efac', flexShrink: 0
                          }}>
                            {selectedUserForDetails.name ? selectedUserForDetails.name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() : <User size={40} />}
                          </div>
                        )}
                        <div>
                          <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1.35rem', fontWeight: '700' }}>
                            {selectedUserForDetails.name}
                          </h4>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                            <span className="badge" style={{ backgroundColor: '#059669', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}>
                              {selectedUserForDetails.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                            <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}>
                              {selectedUserForDetails.auth_provider === 'google' ? 'Google Auth' : 'Akaun Emel Tempatan'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ALAMAT EMEL</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a', fontWeight: '600', fontSize: '0.95rem', wordBreak: 'break-all' }}>
                            <Mail size={16} color="#059669" />
                            <span>{selectedUserForDetails.email}</span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: selectedUserForDetails.email_verified ? '#16a34a' : '#ca8a04', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600' }}>
                            {selectedUserForDetails.email_verified ? '✓ Emel Disahkan' : '⚠ Emel Belum Disahkan'}
                          </span>
                        </div>

                        <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>NOMBOR TELEFON</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a', fontWeight: '600', fontSize: '0.95rem' }}>
                            <Phone size={16} color="#059669" />
                            <span>{selectedUserForDetails.phone_number || 'Belum diisi'}</span>
                          </div>
                          {selectedUserForDetails.phone_number && (
                            <a
                              href={`https://wa.me/6${selectedUserForDetails.phone_number.replace(/^(+?60|0)/, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: '0.75rem', color: '#059669', textDecoration: 'none', fontWeight: '600', marginTop: '0.35rem', display: 'inline-block' }}
                            >
                              💬 Buka WhatsApp
                            </a>
                          )}
                        </div>

                        <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TARIKH DAFTAR</span>
                          <div style={{ color: '#0f172a', fontWeight: '600', fontSize: '0.95rem' }}>
                            {new Date(selectedUserForDetails.created_at).toLocaleDateString('ms-MY', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                            {new Date(selectedUserForDetails.created_at).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID PENGGUNA</span>
                          <div style={{ color: '#64748b', fontSize: '0.75rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                            {selectedUserForDetails.id}
                          </div>
                        </div>
                      </div>

                      {/* User Activities Section */}
                      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Award size={18} color="#059669" />
                          <span>Aktiviti / Program Yang Disertai ({selectedUserEvents.length})</span>
                        </h4>

                        {loadingUserEvents ? (
                          <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>Memuatkan aktiviti...</p>
                        ) : selectedUserEvents.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '220px', overflowY: 'auto' }}>
                            {selectedUserEvents.map(evt => (
                              <div key={evt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div>
                                  <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.9rem' }}>{evt.title}</div>
                                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                    {new Date(evt.event_date).toLocaleDateString('ms-MY')} {evt.venue ? `• ${evt.venue}` : ''}
                                  </div>
                                </div>
                                {evt.has_certificate ? (
                                  <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                                    e-Sijil Tersedia
                                  </span>
                                ) : (
                                  <span style={{ backgroundColor: '#f1f5f9', color: '#64748b', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                                    Disertai
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic', padding: '0.5rem 0', margin: 0 }}>
                            Pengguna ini belum pernah menyertai mana-mana aktiviti masjid.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={{ padding: '1rem 1.75rem', borderTop: '1px solid #f1f5f9', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'flex-end', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
                      <button
                        onClick={() => setSelectedUserForDetails(null)}
                        style={{ padding: '0.6rem 1.5rem', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'events' && (user?.role === 'super_admin' || user?.role === 'setiausaha' || user?.role === 'penolong_setiausaha' || user?.role === 'pengerusi' || user?.role === 'timbalan_pengerusi') && (
            <div className="card-container">
              {(canEditEvents) && (
                <>
                  <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', marginBottom: '3rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#0f172a' }}>Tambah Aktiviti / Program Baru</h3>
                    <form onSubmit={handleCreateEvent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Tajuk Aktiviti</label>
                        <input required type="text" placeholder="Masukkan tajuk..." value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Penerangan / Butiran</label>
                        <textarea placeholder="Terangkan tentang aktiviti ini..." value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="form-textarea" rows={4} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Tarikh & Masa</label>
                        <input required type="datetime-local" value={newEvent.event_date} onChange={e => setNewEvent({...newEvent, event_date: e.target.value})} className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Lokasi / Tempat</label>
                        <input type="text" placeholder="Di mana aktiviti diadakan?" value={newEvent.venue} onChange={e => setNewEvent({...newEvent, venue: e.target.value})} className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Muat Naik Gambar (Pilihan)</label>
                        <input type="file" accept="image/*" onChange={e => setSelectedImageFile(e.target.files ? e.target.files[0] : null)} className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                        {newEvent.image_url && !selectedImageFile && <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Gambar sedia ada: {newEvent.image_url}</p>}
                      </div>
                      
                      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontWeight: 'bold', borderRadius: '8px', backgroundColor: 'var(--color-primary)' }}>
                          Tambah Aktiviti
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              )}

              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, color: '#0f172a' }}>Senarai Aktiviti / Program</h3>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ backgroundColor: '#e2e8f0', color: '#475569', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>Jumlah: {eventsList.length}</span>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input type="month" title="Tapis bulan untuk eksport" value={exportMonthAktiviti} onChange={e => setExportMonthAktiviti(e.target.value)} style={{ padding: '0.35rem', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#475569', fontWeight: '500' }} />
                      <button onClick={() => handleExportPDF('aktiviti')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#eab308', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' }}>
                        <FileText size={16} />
                        Eksport PDF
                      </button>
                    </div>
                  </div>
                </div>
                <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <table className="data-table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>Tarikh & Masa</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>Tajuk Aktiviti</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>Lokasi</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>Dikemaskini Oleh</th>
                        <th style={{ padding: '1rem', textAlign: 'center', color: '#475569', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>Tindakan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventsList.map((ev, index) => (
                        <tr key={ev.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '1rem', color: '#334155', fontWeight: '500' }}>{new Date(ev.event_date).toLocaleString('ms-MY', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                          <td style={{ padding: '1rem', fontWeight: '600', color: '#0f172a' }}>{ev.title}</td>
                          <td style={{ padding: '1rem', color: '#64748b' }}>{ev.venue || '-'}</td>
                          <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>{ev.updated_by || '-'}</td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              <button onClick={() => fetchParticipants(ev)} style={{ backgroundColor: '#0ea5e9', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', transition: 'background-color 0.2s' }}>Peserta</button>
                              {canEditEvents && (
                                <>
                                  <button onClick={() => handleEditEventClick(ev)} style={{ backgroundColor: '#eab308', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', transition: 'background-color 0.2s' }}>Sunting</button>
                                  <button onClick={() => handleDeleteEvent(ev.id!)} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', transition: 'background-color 0.2s' }}>Padam</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'finance' && (user?.role === 'super_admin' || user?.role === 'bendahari' || user?.role === 'penolong_bendahari' || user?.role === 'pengerusi' || user?.role === 'timbalan_pengerusi') && (
            <div className="card-container" style={{ gap: '2rem', display: 'flex', flexDirection: 'column' }}>
              {/* 3-Mode Financial Balance Selector */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', backgroundColor: 'white', padding: '1rem 1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: bakiMode === 'cash' ? '#059669' : bakiMode === 'online' ? '#2563eb' : '#0f172a' }}></div>
                  <div>
                    <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>Pilihan Mod Baki Semasa:</span>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', marginLeft: '0.5rem' }}>
                      {bakiMode === 'all' && 'Baki Keseluruhan (Online + Cash)'}
                      {bakiMode === 'cash' && 'Baki Wang Tunai / Tabung Fizikal Sahaja'}
                      {bakiMode === 'online' && 'Baki Akaun Bank / Atas Talian Sahaja'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'inline-flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '10px', gap: '4px', border: '1px solid #e2e8f0' }}>
                  <button
                    type="button"
                    onClick={() => setBakiMode('all')}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      backgroundColor: bakiMode === 'all' ? '#0f172a' : 'transparent',
                      color: bakiMode === 'all' ? 'white' : '#475569',
                      boxShadow: bakiMode === 'all' ? '0 2px 4px rgba(0,0,0,0.15)' : 'none',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <Layers size={15} />
                    <span>Semua (Online + Cash)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBakiMode('cash')}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      backgroundColor: bakiMode === 'cash' ? '#059669' : 'transparent',
                      color: bakiMode === 'cash' ? 'white' : '#475569',
                      boxShadow: bakiMode === 'cash' ? '0 2px 4px rgba(0,0,0,0.15)' : 'none',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <Banknote size={15} />
                    <span>Cash (Tunai)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBakiMode('online')}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      backgroundColor: bakiMode === 'online' ? '#2563eb' : 'transparent',
                      color: bakiMode === 'online' ? 'white' : '#475569',
                      boxShadow: bakiMode === 'online' ? '0 2px 4px rgba(0,0,0,0.15)' : 'none',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <CreditCard size={15} />
                    <span>Online (Atas Talian)</span>
                  </button>
                </div>
              </div>

              <div className="finance-cards-wrapper" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1rem' }}>
                {/* Card 1: Pemasukan */}
                <div className="glass-panel" style={{ padding: '2rem', background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(4, 120, 87, 0.4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <h4 style={{ color: '#a7f3d0', margin: 0, fontWeight: '500', fontSize: '1.1rem' }}>
                          {bakiMode === 'all' ? 'Jumlah Pemasukan' : bakiMode === 'cash' ? 'Pemasukan (Cash)' : 'Pemasukan (Online)'}
                        </h4>
                      </div>
                      <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700', textShadow: '0 2px 4px rgba(0,0,0,0.2)', color: 'white' }}>
                        <span style={{ fontSize: '1.5rem', opacity: 0.8, marginRight: '4px' }}>RM</span>
                        {currentIncome.toFixed(2)}
                      </h2>
                      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#a7f3d0', opacity: 0.9 }}>
                        {bakiMode === 'all' ? `Tunai: RM ${cashIncome.toFixed(2)} • Online: RM ${onlineIncome.toFixed(2)}` : bakiMode === 'cash' ? 'Kutipan tabung jumaat & derma tunai' : 'Derma QR & pindahan bank'}
                      </div>
                    </div>
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', backdropFilter: 'blur(10px)' }}>
                      <TrendingUp size={32} color="#a7f3d0" />
                    </div>
                  </div>
                </div>

                {/* Card 2: Perbelanjaan */}
                <div className="glass-panel" style={{ padding: '2rem', background: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(185, 28, 28, 0.4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <h4 style={{ color: '#fecaca', margin: 0, fontWeight: '500', fontSize: '1.1rem' }}>
                          {bakiMode === 'all' ? 'Jumlah Perbelanjaan' : bakiMode === 'cash' ? 'Perbelanjaan (Cash)' : 'Perbelanjaan (Online)'}
                        </h4>
                      </div>
                      <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700', textShadow: '0 2px 4px rgba(0,0,0,0.2)', color: 'white' }}>
                        <span style={{ fontSize: '1.5rem', opacity: 0.8, marginRight: '4px' }}>RM</span>
                        {currentExpense.toFixed(2)}
                      </h2>
                      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#fecaca', opacity: 0.9 }}>
                        {bakiMode === 'all' ? `Tunai: RM ${cashExpense.toFixed(2)} • Online: RM ${onlineExpense.toFixed(2)}` : bakiMode === 'cash' ? 'Belanja tunai tangan' : 'Bayaran bil & perbelanjaan bank'}
                      </div>
                    </div>
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', backdropFilter: 'blur(10px)' }}>
                      <TrendingDown size={32} color="#fecaca" />
                    </div>
                  </div>
                </div>

                {/* Card 3: Baki Semasa (3 Mode Responsive) */}
                <div className="glass-panel" style={{ 
                  padding: '2rem', 
                  background: bakiMode === 'cash' ? 'linear-gradient(135deg, #065f46 0%, #047857 100%)' : bakiMode === 'online' ? 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)' : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
                  color: 'white', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '16px', 
                  boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
                  transition: 'background 0.3s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                        <h4 style={{ color: '#cbd5e1', margin: 0, fontWeight: '600', fontSize: '1.1rem' }}>Baki Semasa</h4>
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '0.15rem 0.6rem',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          fontWeight: '700'
                        }}>
                          {bakiMode === 'all' ? 'Online + Cash' : bakiMode === 'cash' ? 'Cash Sahaja' : 'Online Sahaja'}
                        </span>
                      </div>

                      <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700', textShadow: '0 2px 4px rgba(0,0,0,0.2)', color: 'white' }}>
                        <span style={{ fontSize: '1.5rem', opacity: 0.8, marginRight: '4px' }}>RM</span>
                        {currentBalance.toFixed(2)}
                      </h2>

                      {/* Mini Switcher buttons directly on the card */}
                      <div style={{ display: 'flex', gap: '4px', marginTop: '0.75rem' }}>
                        <button
                          type="button"
                          onClick={() => setBakiMode('all')}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: 'none',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            backgroundColor: bakiMode === 'all' ? 'white' : 'rgba(255,255,255,0.15)',
                            color: bakiMode === 'all' ? '#0f172a' : 'white',
                            transition: 'all 0.15s'
                          }}
                        >
                          Semua
                        </button>
                        <button
                          type="button"
                          onClick={() => setBakiMode('cash')}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: 'none',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            backgroundColor: bakiMode === 'cash' ? 'white' : 'rgba(255,255,255,0.15)',
                            color: bakiMode === 'cash' ? '#065f46' : 'white',
                            transition: 'all 0.15s'
                          }}
                        >
                          Cash
                        </button>
                        <button
                          type="button"
                          onClick={() => setBakiMode('online')}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: 'none',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            backgroundColor: bakiMode === 'online' ? 'white' : 'rgba(255,255,255,0.15)',
                            color: bakiMode === 'online' ? '#1e40af' : 'white',
                            transition: 'all 0.15s'
                          }}
                        >
                          Online
                        </button>
                      </div>

                      <div style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                        {bakiMode === 'all' && (
                          <span>Tunai: RM ${cashBalance.toFixed(2)} • Online: RM ${onlineBalance.toFixed(2)}</span>
                        )}
                        {bakiMode === 'cash' && (
                          <span>Masuk: RM ${cashIncome.toFixed(2)} • Keluar: RM ${cashExpense.toFixed(2)}</span>
                        )}
                        {bakiMode === 'online' && (
                          <span>Masuk: RM ${onlineIncome.toFixed(2)} • Keluar: RM ${onlineExpense.toFixed(2)}</span>
                        )}
                      </div>
                    </div>

                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', backdropFilter: 'blur(10px)' }}>
                      <DollarSign size={32} color="#cbd5e1" />
                    </div>
                  </div>
                </div>
              </div>

              {(canEditFinance) && (
                <div style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ background: '#ecfdf5', padding: '0.75rem', borderRadius: '12px' }}>
                      <Wallet size={24} color="#059669" />
                    </div>
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.5rem', fontWeight: '700' }}>{editingTransactionId ? 'Kemaskini Transaksi' : 'Rekod Transaksi Baharu'}</h3>
                  </div>
                  
                  <form onSubmit={handleCreateTransaction} className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Jenis Transaksi</label>
                      <select required value={newTransaction.type} onChange={e => setNewTransaction({...newTransaction, type: e.target.value})} className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: '500' }}>
                        <option value="income">Duit Masuk (Pendapatan)</option>
                        <option value="expense">Duit Keluar (Perbelanjaan)</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Akaun Terlibat</label>
                      <select
                        required
                        value={newTransaction.account_code}
                        onChange={e => {
                          const acc = e.target.value;
                          const pm = acc === 'TUNAI' ? 'Tunai' : (newTransaction.payment_method === 'Tunai' ? 'Atas Talian' : newTransaction.payment_method);
                          setNewTransaction({ ...newTransaction, account_code: acc, payment_method: pm });
                        }}
                        className="form-input"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: '500' }}
                      >
                        <option value="BANK">Duit Dalam Bank</option>
                        <option value="TUNAI">Pegangan (Tunai)</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Jumlah (RM)</label>
                      <input required type="number" step="0.01" min="0" placeholder="RM 0.00" value={newTransaction.amount || ''} onChange={e => setNewTransaction({...newTransaction, amount: parseFloat(e.target.value)})} className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: '500' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Penerangan</label>
                      <input required type="text" placeholder="Bayaran untuk..." value={newTransaction.description} onChange={e => setNewTransaction({...newTransaction, description: e.target.value})} className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: '500' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Kategori</label>
                      <select required value={newTransaction.category} onChange={e => setNewTransaction({...newTransaction, category: e.target.value})} className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: '500' }}>
                        <option value="Tabung Jumaat">Tabung Jumaat</option>
                        <option value="Derma Awam">Derma Awam</option>
                        <option value="Dana Kerajaan">Dana Kerajaan</option>
                        <option value="Bayaran Bil">Bayaran Bil (Air/Elektrik)</option>
                        <option value="Saguhati / Elaun">Saguhati / Elaun Penceramah</option>
                        <option value="Pembelian Barang">Pembelian Barang / Penyelenggaraan</option>
                        <option value="Lain-lain">Lain-lain</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Kaedah Pembayaran</label>
                      <select
                        required
                        value={newTransaction.payment_method}
                        onChange={e => {
                          const pm = e.target.value;
                          const acc = pm === 'Tunai' ? 'TUNAI' : 'BANK';
                          setNewTransaction({ ...newTransaction, payment_method: pm, account_code: acc });
                        }}
                        className="form-input"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: '500' }}
                      >
                        {newTransaction.account_code === 'TUNAI' ? (
                          <option value="Tunai">Tunai (Cash)</option>
                        ) : (
                          <>
                            <option value="Atas Talian">Atas Talian (Transfer/QR)</option>
                            <option value="Cek">Cek</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Resit / Bukti Pembayaran (Pilihan)</label>
                      <input type="file" accept="image/*,.pdf" onChange={e => setReceiptFile(e.target.files?.[0] || null)} className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: '500' }} />
                      {receiptFile && <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 'bold' }}>Fail sedia untuk dimuat naik: {receiptFile.name}</span>}
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                      <button type="submit" className="btn-primary" style={{ padding: '0.8rem 1.5rem', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.2), 0 2px 4px -1px rgba(5, 150, 105, 0.1)' }} onMouseOver={e => Object.assign(e.currentTarget.style, { backgroundColor: '#047857', transform: 'translateY(-1px)' })} onMouseOut={e => Object.assign(e.currentTarget.style, { backgroundColor: '#059669', transform: 'none' })}>
                        {editingTransactionId ? 'Kemaskini Transaksi' : 'Simpan Transaksi'}
                      </button>
                      {editingTransactionId && (
                        <button type="button" onClick={() => { setEditingTransactionId(null); setNewTransaction({ account_code: 'BANK', amount: 0, type: 'income', description: '', payment_method: 'Atas Talian', category: 'Lain-lain' }); setReceiptFile(null); }} style={{ padding: '0.8rem 1.5rem', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                          Batal
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              )}

              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '2.5rem', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.5rem', fontWeight: '700' }}>Sejarah Transaksi Kewangan</h3>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input type="month" title="Tapis bulan untuk eksport" value={exportMonthKewangan} onChange={e => setExportMonthKewangan(e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#475569', fontWeight: '500' }} />
                      <button onClick={() => handleExportPDF('kewangan')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#eab308', color: 'white', padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' }}>
                        <FileText size={18} />
                        Eksport PDF
                      </button>
                    </div>
                    <select value={financeTypeFilter} onChange={(e) => setFinanceTypeFilter(e.target.value)} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#334155', fontWeight: '500' }}>
                      <option value="Semua">Semua Jenis</option>
                      <option value="income">Kemasukkan</option>
                      <option value="expense">Pengeluaran</option>
                    </select>
                    <select value={financeCategoryFilter} onChange={(e) => setFinanceCategoryFilter(e.target.value)} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#334155', fontWeight: '500' }}>
                      <option value="Semua">Semua Kategori</option>
                      <option value="Tabung Jumaat">Tabung Jumaat</option>
                      <option value="Derma Awam">Derma Awam</option>
                      <option value="Dana Kerajaan">Dana Kerajaan</option>
                      <option value="Bayaran Bil">Bayaran Bil</option>
                      <option value="Saguhati / Elaun">Saguhati / Elaun</option>
                      <option value="Pembelian Barang">Pembelian Barang</option>
                      <option value="Lain-lain">Lain-lain</option>
                    </select>
                    <select value={financeMethodFilter} onChange={(e) => setFinanceMethodFilter(e.target.value)} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#334155', fontWeight: '500' }}>
                      <option value="Semua">Semua Kaedah</option>
                      <option value="Atas Talian">Atas Talian</option>
                      <option value="Tunai">Tunai</option>
                      <option value="Cek">Cek</option>
                    </select>
                    <span style={{ backgroundColor: '#f1f5f9', color: '#334155', padding: '0.6rem 1.2rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold', border: '1px solid #e2e8f0' }}>Jumlah: {filteredTransactions.length} rekod</span>
                  </div>
                </div>
                
                <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
                  <table className="data-table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse', minWidth: '950px' }}>
                    <thead style={{ backgroundColor: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '1.25rem 1rem', textAlign: 'left', color: '#475569', fontWeight: '700', borderBottom: '2px solid #e2e8f0', fontSize: '0.95rem' }}>Tarikh</th>
                        <th style={{ padding: '1.25rem 1rem', textAlign: 'left', color: '#475569', fontWeight: '700', borderBottom: '2px solid #e2e8f0', fontSize: '0.95rem' }}>Akaun</th>
                        <th style={{ padding: '1.25rem 1rem', textAlign: 'left', color: '#475569', fontWeight: '700', borderBottom: '2px solid #e2e8f0', fontSize: '0.95rem' }}>Penerangan</th>
                        <th style={{ padding: '1.25rem 1rem', textAlign: 'left', color: '#475569', fontWeight: '700', borderBottom: '2px solid #e2e8f0', fontSize: '0.95rem' }}>Kategori</th>
                        <th style={{ padding: '1.25rem 1rem', textAlign: 'left', color: '#475569', fontWeight: '700', borderBottom: '2px solid #e2e8f0', fontSize: '0.95rem' }}>Kaedah</th>
                        <th style={{ padding: '1.25rem 1rem', textAlign: 'left', color: '#475569', fontWeight: '700', borderBottom: '2px solid #e2e8f0', fontSize: '0.95rem' }}>Jenis</th>
                        <th style={{ padding: '1.25rem 1rem', textAlign: 'right', color: '#475569', fontWeight: '700', borderBottom: '2px solid #e2e8f0', fontSize: '0.95rem' }}>Jumlah (RM)</th>
                        <th style={{ padding: '1.25rem 1rem', textAlign: 'left', color: '#475569', fontWeight: '700', borderBottom: '2px solid #e2e8f0', fontSize: '0.95rem' }}>Dikemaskini Oleh</th>
                        {(canEditFinance) && (
                          <th style={{ padding: '1.25rem 1rem', textAlign: 'center', color: '#475569', fontWeight: '700', borderBottom: '2px solid #e2e8f0', fontSize: '0.95rem' }}>Tindakan</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((t, index) => (
                        <tr key={t.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.15s ease' }} className="table-row-hover">
                          <td style={{ padding: '1.25rem 1rem', color: '#64748b', fontWeight: '500' }}>{new Date(t.created_at!).toLocaleDateString('ms-MY')}</td>
                          <td style={{ padding: '1.25rem 1rem', fontWeight: '700', color: '#0f172a' }}>{t.account_name}</td>
                          <td style={{ padding: '1.25rem 1rem', color: '#334155', fontWeight: '500' }}>
                            {t.description}
                            {t.receipt_url && (
                              <div style={{ marginTop: '0.5rem' }}>
                                <a href={t.receipt_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#e0f2fe', color: '#0284c7', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600', textDecoration: 'none' }}>
                                  📎 Lihat Resit
                                </a>
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '1.25rem 1rem', color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>{t.category}</td>
                          <td style={{ padding: '1.25rem 1rem', color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>{t.payment_method}</td>
                          <td style={{ padding: '1.25rem 1rem' }}>
                            <span className="badge" style={{ backgroundColor: t.type === 'income' ? '#dcfce7' : '#fee2e2', color: t.type === 'income' ? '#166534' : '#991b1b', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700', border: `1px solid ${t.type === 'income' ? '#bbf7d0' : '#fecaca'}` }}>
                              {t.type === 'income' ? 'MASUK' : 'KELUAR'}
                            </span>
                          </td>
                          <td style={{ padding: '1.25rem 1rem', textAlign: 'right', fontWeight: '800', fontSize: '1.15rem', color: t.type === 'income' ? '#16a34a' : '#ef4444' }}>
                            {t.type === 'income' ? '+' : '-'}{Number(t.amount || 0).toFixed(2)}
                          </td>
                          <td style={{ padding: '1.25rem 1rem', color: '#64748b', fontSize: '0.9rem' }}>
                            {t.updated_by ? (
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span>{t.updated_by}</span>
                                {t.updated_at && <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>[{new Date(t.updated_at).toLocaleString('ms-MY', { dateStyle: 'short', timeStyle: 'short' })}]</span>}
                              </div>
                            ) : '-'}
                          </td>
                          {(canEditFinance) && (
                            <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                <button onClick={() => handleEditTransactionClick(t)} style={{ backgroundColor: '#eab308', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s', fontSize: '0.9rem' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#ca8a04'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#eab308'}>
                                  Sunting
                                </button>
                                <button onClick={() => handleDeleteTransaction(t.id!)} style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s', fontSize: '0.9rem' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#fecaca'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#fee2e2'}>
                                  Padam
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                      {filteredTransactions.length === 0 && (
                        <tr>
                          <td colSpan={(canEditFinance) ? 9 : 8} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '1.1rem', fontWeight: '500' }}>
                            Tiada rekod transaksi dijumpai untuk kriteria carian ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logistics' && (user?.role === 'super_admin' || user?.role === 'ajk_peralatan' || user?.role === 'pengerusi' || user?.role === 'timbalan_pengerusi') && (
            <div className="card-container">
              {(canEditInventory) && (
                <div style={{ backgroundColor: '#f8fafc', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '3rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, color: '#0f172a' }}>{editingInventoryId ? 'Kemaskini Peralatan' : 'Tambah Peralatan Baru'}</h3>
                    {editingInventoryId && (
                      <button type="button" onClick={() => { setEditingInventoryId(null); setNewItem({ item_name: '', quantity: 1, condition: 'baik', notes: '' }); }} style={{ backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Batal Kemaskini</button>
                    )}
                  </div>
                  <form onSubmit={handleCreateItem} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Nama Barang</label>
                      <input required type="text" placeholder="Contoh: Sejadah" value={newItem.item_name} onChange={e => setNewItem({...newItem, item_name: e.target.value})} className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Kuantiti</label>
                      <input required type="number" min="1" placeholder="0" value={newItem.quantity || ''} onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value)})} className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Keadaan</label>
                      <select required value={newItem.condition} onChange={e => setNewItem({...newItem, condition: e.target.value})} className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}>
                        <option value="baik">Keadaan Baik</option>
                        <option value="memuaskan">Memuaskan</option>
                        <option value="rosak">Rosak</option>
                        <option value="hilang">Hilang</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Catatan Tambahan (Pilihan)</label>
                      <input type="text" placeholder="Sebarang info tambahan..." value={newItem.notes} onChange={e => setNewItem({...newItem, notes: e.target.value})} className="form-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    </div>
                    
                    <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                      <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontWeight: 'bold', borderRadius: '8px', backgroundColor: editingInventoryId ? '#0284c7' : 'var(--color-primary)' }}>
                        {editingInventoryId ? 'Kemaskini Data' : 'Simpan Peralatan'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, color: '#0f172a' }}>Senarai Inventori Masjid</h3>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ backgroundColor: '#e2e8f0', color: '#475569', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>Jumlah Rekod: {inventoryList.length}</span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input type="month" title="Tapis bulan untuk eksport" value={exportMonthLogistik} onChange={e => setExportMonthLogistik(e.target.value)} style={{ padding: '0.35rem', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#475569', fontWeight: '500' }} />
                    <button onClick={() => handleExportPDF('logistik')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#eab308', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' }}>
                      <FileText size={16} />
                      Eksport PDF
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
                <table className="data-table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse', minWidth: '950px' }}>
                  <thead style={{ backgroundColor: '#f8fafc' }}>
                    <tr>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>Nama Barang</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>Kuantiti</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>Status Pinjaman</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>Keadaan</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>Catatan</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>Dikemaskini</th>
                      <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>Dikemaskini Oleh</th>
                      <th style={{ padding: '1rem', textAlign: 'center', color: '#475569', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryList.map((item, index) => {
                      const borrowedQty = loansList.filter(l => l.inventory_id === item.id && l.status === 'dipinjam').reduce((sum, l) => sum + l.quantity, 0);
                      const availableQty = item.quantity - borrowedQty;
                      return (
                      <tr key={item.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '1rem', fontWeight: '600', color: '#0f172a' }}>{item.item_name}</td>
                        <td style={{ padding: '1rem', color: '#334155', fontWeight: '500' }}>{item.quantity} unit</td>
                        <td style={{ padding: '1rem', color: '#334155', fontSize: '0.9rem' }}>
                          <div style={{ marginBottom: '0.25rem' }}>Tersedia: <strong style={{ color: '#16a34a' }}>{availableQty}</strong></div>
                          {borrowedQty > 0 && <div>Dipinjam: <strong style={{ color: '#ef4444' }}>{borrowedQty}</strong></div>}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span className="badge" style={{
                            backgroundColor: item.condition === 'baik' ? '#dcfce7' : item.condition === 'memuaskan' ? '#fef9c3' : '#fee2e2',
                            color: item.condition === 'baik' ? '#166534' : item.condition === 'memuaskan' ? '#854d0e' : '#991b1b',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: '600'
                          }}>
                            {item.condition.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: '#64748b', fontStyle: item.notes ? 'normal' : 'italic' }}>{item.notes || 'Tiada catatan'}</td>
                        <td style={{ padding: '1rem', color: '#64748b' }}>{new Date(item.updated_at!).toLocaleDateString('ms-MY')}</td>
                        <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>{item.updated_by || '-'}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          {(canEditInventory) && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                              <button onClick={() => {
                                setBorrowForm({ ...borrowForm, inventory_id: item.id!, quantity: 1 });
                                setIsBorrowModalOpen(true);
                              }} style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', transition: 'background-color 0.2s' }}>Pinjamkan</button>
                              <button onClick={() => handleEditItemClick(item)} style={{ backgroundColor: '#0284c7', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', transition: 'background-color 0.2s' }}>Sunting</button>
                              <button onClick={() => handleDeleteItem(item.id!)} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', transition: 'background-color 0.2s' }}>Padam</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>

              {/* Loans Section */}
              <div style={{ marginTop: '3rem', backgroundColor: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, color: '#0f172a' }}>Rekod Pinjaman Peralatan</h3>
                  <span style={{ backgroundColor: '#e2e8f0', color: '#475569', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    Rekod Aktif: {loansList.filter(l => l.status === 'dipinjam').length}
                  </span>
                </div>
                <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <table className="data-table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse', minWidth: '950px' }}>
                    <thead style={{ backgroundColor: '#f8fafc' }}>
                      <tr>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>Nama Peminjam</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>No. Telefon</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>Barang (Kuantiti)</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>Tarikh Pinjam</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>Status</th>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>Dikemaskini Oleh</th>
                        <th style={{ padding: '1rem', textAlign: 'center', color: '#475569', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>Tindakan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loansList.length === 0 ? (
                        <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Tiada rekod pinjaman buat masa ini.</td></tr>
                      ) : loansList.map((loan, index) => (
                        <tr key={loan.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '1rem', fontWeight: '600', color: '#0f172a' }}>{loan.borrower_name}</td>
                          <td style={{ padding: '1rem', color: '#334155' }}>{loan.borrower_phone || '-'}</td>
                          <td style={{ padding: '1rem', color: '#334155', fontWeight: '500' }}>
                            {loan.item_name} <span style={{ color: '#ef4444' }}>({loan.quantity})</span>
                          </td>
                          <td style={{ padding: '1rem', color: '#64748b' }}>{new Date(loan.borrow_date!).toLocaleDateString('ms-MY')}</td>
                          <td style={{ padding: '1rem' }}>
                            <span className="badge" style={{
                              backgroundColor: loan.status === 'dipinjam' ? '#fee2e2' : '#dcfce7',
                              color: loan.status === 'dipinjam' ? '#991b1b' : '#166534',
                              padding: '0.4rem 0.8rem',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              fontWeight: '600'
                            }}>
                              {loan.status?.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>{loan.updated_by || '-'}</td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            {loan.status === 'dipinjam' && (user?.role === 'ajk_peralatan' || user?.role === 'super_admin') ? (
                              <button onClick={() => handleReturnItem(loan.id!)} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Dipulangkan</button>
                            ) : loan.status === 'dipulangkan' ? (
                              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{new Date(loan.return_date!).toLocaleDateString('ms-MY')}</span>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Borrow Modal */}
              {isBorrowModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                  <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#0f172a' }}>Daftar Pinjaman Baru</h3>
                    <form onSubmit={handleBorrowItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Nama Peminjam</label>
                        <input type="text" required value={borrowForm.borrower_name} onChange={e => setBorrowForm({...borrowForm, borrower_name: e.target.value})} className="form-input" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>No. Telefon (Pilihan)</label>
                        <input type="text" value={borrowForm.borrower_phone} onChange={e => setBorrowForm({...borrowForm, borrower_phone: e.target.value})} className="form-input" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Kuantiti Dipinjam</label>
                        <input type="number" min="1" required value={borrowForm.quantity} onChange={e => setBorrowForm({...borrowForm, quantity: parseInt(e.target.value)})} className="form-input" style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => setIsBorrowModalOpen(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', backgroundColor: '#e2e8f0', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>Batal</button>
                        <button type="submit" style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', backgroundColor: '#f59e0b', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Simpan Pinjaman</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="card" style={{ padding: '2rem' }}>
              <h2 style={{ color: '#0f172a', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Settings size={24} color="var(--color-primary)" />
                Tetapan Akaun & Sistem
              </h2>
              <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                <h3 style={{ marginTop: 0, color: '#334155', fontSize: '1.2rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem' }}>Maklumat Profil</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: '#475569' }}>Nama:</span>
                    <span style={{ color: '#0f172a', padding: '0.5rem 1rem', backgroundColor: '#e2e8f0', borderRadius: '4px' }}>{user?.name}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: '#475569' }}>Peranan:</span>
                    <span style={{ color: '#0f172a', padding: '0.5rem 1rem', backgroundColor: '#e2e8f0', borderRadius: '4px', textTransform: 'capitalize' }}>{user?.role.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#fffbeb', padding: '1.5rem', borderRadius: '8px', border: '1px solid #fde68a' }}>
                <p style={{ margin: 0, color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong>Makluman:</strong> Ciri kemaskini profil, kata laluan, dan tetapan sistem yang lain sedang dalam pembangunan dan akan disediakan kelak.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {isParticipantsModalOpen && selectedEventForParticipants && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'white', padding: '2rem', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--color-primary)' }}>
              Senarai Peserta: {selectedEventForParticipants.title}
            </h3>
            {participantsList.length === 0 ? (
              <p style={{ color: '#64748b' }}>Tiada peserta berdaftar lagi.</p>
            ) : (
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#f8fafc' }}>
                    <tr>
                      <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>Nama</th>
                      <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>Emel</th>
                      <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>Tarikh Daftar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participantsList.map((p, idx) => (
                      <tr key={p.id} style={{ borderBottom: idx < participantsList.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                        <td style={{ padding: '0.75rem 1rem' }}>{p.name}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{p.email}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{new Date(p.created_at).toLocaleString('ms-MY', { dateStyle: 'short', timeStyle: 'short' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-outline" onClick={() => setIsParticipantsModalOpen(false)} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
