"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Users, Plus, Edit2, Trash2, Search,
    Clock, TrendingUp, DollarSign, UserCheck,
    UserX, X, Save, ChevronRight, Award,
    Calendar, BarChart3
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant-context";

interface Employee {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    employee_code: string;
    position: string;
    hourly_wage: number;
    monthly_salary: number;
    start_date: string;
    status: 'active' | 'inactive' | 'on_leave';
    pin_code: string;
    avatar_url?: string;
}

export default function EmployeeManager({ showToast }: any) {
    const { currentTenant } = useTenant();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>("all");

    // Form State
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        employee_code: "",
        position: "",
        hourly_wage: 0,
        monthly_salary: 0,
        start_date: new Date().toISOString().split('T')[0],
        status: "active" as 'active' | 'inactive' | 'on_leave',
        pin_code: ""
    });

    useEffect(() => {
        if (currentTenant) fetchEmployees();
    }, [currentTenant]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEmployees(data || []);
        } catch (error: any) {
            showToast(error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            // Validation
            if (!formData.first_name || !formData.last_name) {
                showToast("Ad ve Soyad gerekli!", "error");
                return;
            }

            if (!formData.employee_code) {
                // Auto-generate employee code if not provided
                formData.employee_code = `ÇLŞ-${Date.now().toString().slice(-6)}`;
            }

            if (editingEmployee) {
                const { error } = await supabase
                    .from('employees')
                    .update(formData)
                    .eq('id', editingEmployee.id);

                if (error) throw error;
                showToast("Çalışan güncellendi", "success");
            } else {
                const { error } = await supabase
                    .from('employees')
                    .insert([formData]);

                if (error) throw error;
                showToast("Yeni çalışan eklendi", "success");
            }

            setIsModalOpen(false);
            resetForm();
            fetchEmployees();
        } catch (error: any) {
            showToast(error.message, "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu çalışanı silmek istediğinizden emin misiniz?")) return;

        try {
            const { error } = await supabase
                .from('employees')
                .delete()
                .eq('id', id);

            if (error) throw error;
            showToast("Çalışan silindi", "info");
            fetchEmployees();
        } catch (error: any) {
            showToast(error.message, "error");
        }
    };

    const resetForm = () => {
        setFormData({
            first_name: "",
            last_name: "",
            email: "",
            phone: "",
            employee_code: "",
            position: "",
            hourly_wage: 0,
            monthly_salary: 0,
            start_date: new Date().toISOString().split('T')[0],
            status: "active",
            pin_code: ""
        });
        setEditingEmployee(null);
    };

    const openEditModal = (employee: Employee) => {
        setEditingEmployee(employee);
        setFormData({
            first_name: employee.first_name,
            last_name: employee.last_name,
            email: employee.email || "",
            phone: employee.phone || "",
            employee_code: employee.employee_code,
            position: employee.position || "",
            hourly_wage: employee.hourly_wage || 0,
            monthly_salary: employee.monthly_salary || 0,
            start_date: employee.start_date || new Date().toISOString().split('T')[0],
            status: employee.status,
            pin_code: employee.pin_code || ""
        });
        setIsModalOpen(true);
    };

    // Filter employees
    const filteredEmployees = employees.filter(emp => {
        const matchesSearch =
            emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === "all" || emp.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    // Calculate statistics
    const stats = {
        total: employees.length,
        active: employees.filter(e => e.status === 'active').length,
        inactive: employees.filter(e => e.status === 'inactive').length,
        onLeave: employees.filter(e => e.status === 'on_leave').length
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-widest uppercase flex items-center gap-3">
                        <Users className="text-primary" />
                        ÇALIŞAN YÖNETİMİ
                    </h1>
                    <p className="text-secondary font-bold text-sm uppercase tracking-wider mt-1">
                        Personel bilgileri ve vardiya takibi
                    </p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setIsModalOpen(true);
                    }}
                    className="px-6 py-3 bg-primary hover:bg-primary/80 rounded-xl font-black uppercase tracking-wider transition-all flex items-center gap-2"
                >
                    <Plus size={20} />
                    Yeni Çalışan
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-secondary uppercase">Toplam Çalışan</p>
                            <p className="text-3xl font-black text-white mt-2">{stats.total}</p>
                        </div>
                        <Users className="text-primary w-10 h-10 opacity-20" />
                    </div>
                </motion.div>

                <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-secondary uppercase">Aktif</p>
                            <p className="text-3xl font-black text-emerald-400 mt-2">{stats.active}</p>
                        </div>
                        <UserCheck className="text-emerald-400 w-10 h-10 opacity-20" />
                    </div>
                </motion.div>

                <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-secondary uppercase">İzinli</p>
                            <p className="text-3xl font-black text-amber-400 mt-2">{stats.onLeave}</p>
                        </div>
                        <Calendar className="text-amber-400 w-10 h-10 opacity-20" />
                    </div>
                </motion.div>

                <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-secondary uppercase">Pasif</p>
                            <p className="text-3xl font-black text-rose-400 mt-2">{stats.inactive}</p>
                        </div>
                        <UserX className="text-rose-400 w-10 h-10 opacity-20" />
                    </div>
                </motion.div>
            </div>

            {/* Search and Filter */}
            <div className="glass-card p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" size={20} />
                        <input
                            type="text"
                            placeholder="Çalışan ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl text-white placeholder-secondary focus:outline-none focus:border-primary transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        {['all', 'active', 'inactive', 'on_leave'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-3 rounded-xl font-bold uppercase text-xs transition-all ${filterStatus === status
                                    ? 'bg-primary text-white'
                                    : 'bg-white/5 text-secondary hover:bg-white/10'
                                    }`}
                            >
                                {status === 'all' ? 'Tümü' : status === 'active' ? 'Aktif' : status === 'on_leave' ? 'İzinli' : 'Pasif'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Employee Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/5 border-b border-border">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-black uppercase text-secondary">Çalışan Kodu</th>
                                <th className="px-6 py-4 text-left text-xs font-black uppercase text-secondary">Ad Soyad</th>
                                <th className="px-6 py-4 text-left text-xs font-black uppercase text-secondary">Pozisyon</th>
                                <th className="px-6 py-4 text-left text-xs font-black uppercase text-secondary">İletişim</th>
                                <th className="px-6 py-4 text-left text-xs font-black uppercase text-secondary">Maaş</th>
                                <th className="px-6 py-4 text-left text-xs font-black uppercase text-secondary">Durum</th>
                                <th className="px-6 py-4 text-right text-xs font-black uppercase text-secondary">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            <span className="text-secondary font-bold">Yükleniyor...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <Users className="w-16 h-16 mx-auto text-secondary/30 mb-4" />
                                        <p className="text-secondary font-bold">Çalışan bulunamadı</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((employee, index) => (
                                    <motion.tr
                                        key={employee.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="border-b border-border hover:bg-white/5 transition-all"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-sm font-bold text-primary">{employee.employee_code}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                                                    <span className="font-black text-primary">
                                                        {employee.first_name[0]}{employee.last_name[0]}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">{employee.first_name} {employee.last_name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-secondary font-medium">{employee.position || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs space-y-1">
                                                {employee.phone && <p className="text-secondary font-mono">{employee.phone}</p>}
                                                {employee.email && <p className="text-secondary/60">{employee.email}</p>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                {employee.monthly_salary > 0 ? (
                                                    <span className="font-bold text-emerald-400">₺{employee.monthly_salary.toLocaleString('tr-TR')}/ay</span>
                                                ) : employee.hourly_wage > 0 ? (
                                                    <span className="font-bold text-blue-400">₺{employee.hourly_wage}/saat</span>
                                                ) : (
                                                    <span className="text-secondary">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${employee.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                                                employee.status === 'on_leave' ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-rose-500/20 text-rose-400'
                                                }`}>
                                                {employee.status === 'active' ? 'Aktif' : employee.status === 'on_leave' ? 'İzinli' : 'Pasif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(employee)}
                                                    className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(employee.id)}
                                                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Employee Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                            <h2 className="text-xl font-black uppercase flex items-center gap-2">
                                <Users className="text-primary" />
                                {editingEmployee ? 'Çalışan Düzenle' : 'Yeni Çalışan'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase mb-2">Ad *</label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white focus:outline-none focus:border-primary transition-all"
                                        placeholder="Ahmet"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase mb-2">Soyad *</label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white focus:outline-none focus:border-primary transition-all"
                                        placeholder="Yılmaz"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase mb-2">Çalışan Kodu</label>
                                    <input
                                        type="text"
                                        value={formData.employee_code}
                                        onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white font-mono focus:outline-none focus:border-primary transition-all"
                                        placeholder="ÇLŞ-001 (otomatik oluşturulur)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase mb-2">Pozisyon</label>
                                    <input
                                        type="text"
                                        value={formData.position}
                                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white focus:outline-none focus:border-primary transition-all"
                                        placeholder="Kasiyer, Müdür vb."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase mb-2">E-posta</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white focus:outline-none focus:border-primary transition-all"
                                        placeholder="ornek@email.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase mb-2">Telefon</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white focus:outline-none focus:border-primary transition-all"
                                        placeholder="0555 123 4567"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase mb-2">Saat Başı Ücret (₺)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.hourly_wage}
                                        onChange={(e) => setFormData({ ...formData, hourly_wage: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white focus:outline-none focus:border-primary transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase mb-2">Aylık Maaş (₺)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.monthly_salary}
                                        onChange={(e) => setFormData({ ...formData, monthly_salary: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white focus:outline-none focus:border-primary transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase mb-2">İşe Başlama Tarihi</label>
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white focus:outline-none focus:border-primary transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase mb-2">PIN Kodu (4-6 hane)</label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={formData.pin_code}
                                        onChange={(e) => setFormData({ ...formData, pin_code: e.target.value.replace(/\D/g, '') })}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-white font-mono focus:outline-none focus:border-primary transition-all"
                                        placeholder="1234"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-secondary uppercase mb-2">Durum</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: 'active', label: 'Aktif', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
                                        { value: 'on_leave', label: 'İzinli', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
                                        { value: 'inactive', label: 'Pasif', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' }
                                    ].map(status => (
                                        <button
                                            key={status.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, status: status.value as 'active' | 'inactive' | 'on_leave' })}
                                            className={`px-4 py-3 rounded-xl font-bold uppercase text-xs border-2 transition-all ${formData.status === status.value
                                                ? status.color
                                                : 'bg-white/5 text-secondary border-border hover:bg-white/10'
                                                }`}
                                        >
                                            {status.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6 pt-6 border-t border-border">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-black uppercase tracking-wider transition-all"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 px-6 py-3 bg-primary hover:bg-primary/80 rounded-xl font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                            >
                                <Save size={20} />
                                Kaydet
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
