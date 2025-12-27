import React, { useEffect, useState } from 'react';
import { Download, FileText, Calendar, DollarSign } from 'lucide-react';
import axios from 'axios';
import { apis, API } from '../types';
import { getUserData } from '../userStore/userData';

const Invoices = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = getUserData()?.token;

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const res = await axios.get(apis.getPayments, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    timeout: 5000 // 5 seconds timeout
                });
                setPayments(res.data);
            } catch (err) {
                console.error('Error fetching payments:', err);
                // On error, let the loading clear so demo can show
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchPayments();
        }
    }, [token]);

    const handleDownload = (invoicePath) => {
        // Since invoicePath is absolute on backend, we might need to adjust it or 
        // rely on the static serving we just set up.
        // Assuming the backend serves it at /invoices/filename
        const fileName = invoicePath.split('\\').pop().split('/').pop();
        const downloadUrl = `${API.replace('/api', '')}/invoices/${fileName}`;
        window.open(downloadUrl, '_blank');
    };

    return (
        <div className="p-4 md:p-8 h-full bg-secondary overflow-y-auto">
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-maintext mb-2">Billing & Invoices</h1>
                <p className="text-sm md:text-base text-subtext">View and download your subscription invoices.</p>
            </div>

            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-surface border-b border-border">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-subtext">Plan</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-subtext">Date</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-subtext">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-subtext">Status</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-subtext text-right">Invoice</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {/* Demo Row shown when no real payments exist */}
                            {payments.length === 0 && (
                                <tr className="bg-blue-50/30">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-primary italic">Starter Plan (Demo)</div>
                                        <div className="text-xs text-subtext">ID: demo_transaction_123</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-subtext">
                                            <Calendar className="w-4 h-4" />
                                            {new Date().toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-semibold text-maintext">
                                        USD 0.00
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            DEMO
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDownload('demo_invoice.pdf')}
                                            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold text-sm transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download
                                        </button>
                                    </td>
                                </tr>
                            )}

                            {payments.map((payment) => (
                                <tr key={payment._id} className="hover:bg-surface/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-maintext">{payment.planName}</div>
                                        <div className="text-xs text-subtext">ID: {payment.transactionId}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-subtext">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(payment.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-semibold text-maintext">
                                        {payment.currency} {payment.amount.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${payment.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {payment.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDownload(payment.invoicePath)}
                                            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold text-sm transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Invoices;
