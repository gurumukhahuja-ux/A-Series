import React, { useState, useEffect } from 'react';
import { Users, ShoppingBag, AlertTriangle, Activity, DollarSign, Loader2 } from 'lucide-react';
import apiService from '../../services/apiService';
import CreateAppModal from './CreateAppModal';

const AdminOverview = () => {
    const [statsData, setStatsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const fetchStats = async () => {
        try {
            const data = await apiService.getAdminOverviewStats();
            setStatsData(data);
        } catch (err) {
            console.error("Failed to fetch admin overview stats:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleCreateApp = async (formData) => {
        try {
            // Map agentUrl to url for backend compatibility
            const payload = {
                ...formData,
                url: formData.agentUrl
            };
            delete payload.agentUrl;

            await apiService.createAgent(payload);
            await fetchStats(); // Refresh list
        } catch (error) {
            console.error("Error creating agent:", error);
            throw error;
        }
    };

    if (loading) {
        return (
            <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    const snapshot = [
        { label: 'Total Users', value: statsData?.totalUsers?.toLocaleString() || '0', trend: '0%', direction: 'down' },
        { label: 'Active Users', value: statsData?.activeAgents?.toLocaleString() || '0', trend: '0%', direction: 'down' },
        { label: 'Revenue (MTD)', value: `$${(statsData?.financials?.grossSales || 0).toLocaleString()}`, trend: '0%', direction: 'down' },
    ];

    return (
        <div className="space-y-10 pb-12">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#1E293B]">Dashboard Overview</h1>
                    <p className="text-subtext mt-1">Welcome back, AI-Mall™. Here's what's happening today.</p>
                </div>

            </div>

            {/* Main Status Card */}
            <div className="bg-white border border-[#E0E4E8] rounded-3xl p-8 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-8">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
                        <Activity className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-[#1E293B]">Systems Operational</h2>
                        <div className="flex items-center gap-4 mt-2">
                            <span className="px-3 py-1 bg-[#F1F5F9] text-[#475569] rounded-full text-xs font-bold uppercase tracking-wider">System Ready</span>
                            <div className="w-1 h-1 bg-[#CBD5E1] rounded-full" />
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-primary rounded-full" />
                                <span className="text-xs font-bold text-primary uppercase tracking-wider">Production V2.4</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-12 border-l border-[#E0E4E8] pl-12">
                    <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-subtext" />
                        <div>
                            <p className="text-[10px] text-subtext font-bold uppercase tracking-wider">Last Review</p>
                            <p className="text-sm font-bold text-[#1E293B]">No recent reviews</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-subtext" />
                        <div>
                            <p className="text-[10px] text-subtext font-bold uppercase tracking-wider">Compliance</p>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                <p className="text-sm font-bold text-[#1E293B]">Pending Apps</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Snapshot */}
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-6 bg-primary rounded-full" />
                    <h3 className="text-[11px] font-extrabold text-[#1E293B] uppercase tracking-[2px]">Performance Snapshot</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {snapshot.map((item, index) => (
                        <div key={index} className="bg-white border border-[#E0E4E8] rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4 text-subtext">
                                <span className="text-[11px] font-bold uppercase tracking-wider">{item.label}</span>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-red-400">
                                    <Activity className="w-3 h-3 rotate-180" />
                                    {item.trend}
                                </div>
                            </div>
                            <h4 className="text-4xl font-bold text-[#1E293B]">{item.value}</h4>
                        </div>
                    ))}
                </div>
            </div>

            {/* Financial Overview */}
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-6 bg-primary rounded-full" />
                    <h3 className="text-[11px] font-extrabold text-[#1E293B] uppercase tracking-[2px]">Financial Overview</h3>
                </div>

                <div className="bg-white border border-[#E0E4E8] rounded-3xl p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2 text-primary font-bold text-sm">
                            <Activity className="w-4 h-4" />
                            FINANCIAL OVERVIEW
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1 hover:underline">
                                INVOICE <Activity className="w-3 h-3 rotate-180" />
                            </button>
                            <Activity className="w-4 h-4 text-subtext" />
                            <Activity className="w-4 h-4 text-subtext" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="p-6 bg-[#F8F9FB] border border-[#E0E4E8] rounded-2xl">
                            <p className="text-[10px] text-subtext font-bold uppercase tracking-wider mb-2">Gross Sales</p>
                            <h4 className="text-3xl font-bold text-[#1E293B]">${(statsData?.financials?.grossSales || 0).toLocaleString()}</h4>
                        </div>
                        <div className="p-6 bg-[#F8F9FB] border border-red-100 rounded-2xl">
                            <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider mb-2">Platform Fee (50%)</p>
                            <h4 className="text-3xl font-bold text-red-500">${(statsData?.financials?.platformFee || 0).toLocaleString()}</h4>
                        </div>
                        <div className="p-6 bg-[#F0F7FF] border border-blue-100 rounded-2xl">
                            <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-2">Net Earnings</p>
                            <h4 className="text-3xl font-bold text-primary">${(statsData?.financials?.netEarnings || 0).toLocaleString()}</h4>
                        </div>
                        <div className="p-6 flex flex-col justify-center">
                            <p className="text-[10px] text-subtext font-bold uppercase tracking-wider mb-1">Status</p>
                            <span className="w-fit px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-[10px] font-bold border border-orange-100 mb-3">{statsData?.financials?.status || 'N/A'}</span>
                            <p className="text-[10px] text-subtext font-bold uppercase tracking-wider mb-1">Next Payout</p>
                            <p className="text-sm font-bold text-[#1E293B]">{statsData?.financials?.nextPayout || 'Pending'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <CreateAppModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateApp}
            />
        </div>
    );
};

export default AdminOverview;
