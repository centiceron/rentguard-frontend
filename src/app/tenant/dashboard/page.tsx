"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building,
  IndianRupee,
  FileText,
  Shield,
  LogOut,
  LayoutDashboard,
  Settings,
  BellRing,
  Clock,
  CheckCircle,
  Eye,
  PenTool,
  AlertCircle,
  Loader2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// 🔥 1. IMPORT YOUR NEW COMMAND CENTER
import LeaseCommandCenter from "@/components/LeaseCommandCenter";
import PaymentGateway from "@/components/PaymentGateway";

export default function TenantDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [leases, setLeases] = useState<any[]>([]);
  const [activeView, setActiveView] = useState("overview");
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);

  // 🔥 VAULT UPLOAD STATES
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLandlordName, setUploadLandlordName] = useState("");
  const [uploadRentAmount, setUploadRentAmount] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // 🔥 2. STATE FOR THE COMMAND CENTER MODAL
  const [activeCommandLease, setActiveCommandLease] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/auth");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== "tenant") {
      router.push("/landlord/dashboard");
      return;
    }
    setUser(parsedUser);
    fetchMyLeases(parsedUser.token);
  }, [router]);

  const fetchMyLeases = async (token: string) => {
    try {
      const res = await fetch("http://localhost:5000/api/lease/tenant-leases", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Catch the expired token!
      if (res.status === 401) {
        console.error("Session expired. Logging out.");
        localStorage.clear();
        router.push("/auth");
        return; // Stop execution
      }

      const data = await res.json();
      if (res.ok) setLeases(data.leases || []);
    } catch (error) {
      console.error("Failed to fetch leases", error);
    }
  };

  // 1. Catches the file and opens the sleek modal
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") return alert("Please upload a PDF.");

    setUploadFile(file);
    setShowUploadModal(true);
    setUploadLandlordName("");
    setUploadRentAmount("");
  };

  // 2. Fires when they click "Secure Document" in the modal
  const confirmVaultUpload = async () => {
    if (!uploadFile) return;
    setIsUploading(true);

    const reader = new FileReader();
    reader.readAsDataURL(uploadFile);
    reader.onload = async () => {
      const base64String = (reader.result as string).split(",")[1];

      try {
        const res = await fetch(
          "http://localhost:5000/api/lease/tenant-external",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user.token}`,
            },
            body: JSON.stringify({
              pdfBase64: base64String,
              landlordName: uploadLandlordName || "Unknown Broker",
              monthlyRent: Number(uploadRentAmount) || 0,
            }),
          },
        );

        const data = await res.json();

        if (res.ok) {
          fetchMyLeases(user.token); // Update background list
          setShowUploadModal(false); // Close upload modal
          setUploadFile(null); // Clear file memory

          // 🔥 THE MAGIC TRICK: Auto-open the Command Center!
          setActiveCommandLease(data.lease);
        }
      } catch (error) {
        console.error("Upload failed", error);
      }
      setIsUploading(false);
    };
  };

  // 🔥 3. SILENT DASHBOARD POLLER
  useEffect(() => {
    if (!leases || leases.length === 0 || !user) return;

    // Check if ANY lease is waiting for action
    const hasPendingLeases = leases.some(
      (l: any) =>
        l.documentStatus === "Pending_Handshake" ||
        l.documentStatus === "Awaiting_Tenant" ||
        l.documentStatus === "Awaiting_Witness",
    );

    if (!hasPendingLeases) return; // Stop polling if everything is active/terminated

    const intervalId = setInterval(() => {
      fetchMyLeases(user.token);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [leases, user]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/auth");
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Pending_Handshake":
        return (
          <span className='bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit'>
            <Clock className='h-3 w-3' /> Awaiting Landlord
          </span>
        );
      case "Awaiting_Tenant":
        return (
          <span className='bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit'>
            <PenTool className='h-3 w-3' /> Action Required
          </span>
        );
      case "Awaiting_Witness":
        return (
          <span className='bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit'>
            <Eye className='h-3 w-3' /> Awaiting Witnesses
          </span>
        );
      case "Active":
        return (
          <span className='bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit'>
            <CheckCircle className='h-3 w-3' /> Active Lease
          </span>
        );
      default:
        return (
          <span className='bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold w-fit'>
            {status}
          </span>
        );
    }
  };

  // KPI CALCULATIONS
  const activeLeases = leases.filter((l) => l.documentStatus === "Active");
  const activeLeasesCount = activeLeases.length;
  const totalMonthlyRent = activeLeases.reduce(
    (sum, l) => sum + (l.monthlyRent || 0),
    0,
  );
  const pendingActions = leases.filter(
    (l) => l.documentStatus === "Awaiting_Tenant",
  ).length;

  const hasManualPayments = activeLeases.some((l) => !l.isAutopayActive);

  if (!user) return null;

  return (
    <div className='min-h-screen bg-slate-50 flex'>
      {/* SIDEBAR */}
      <aside className='w-64 bg-slate-900 text-white flex flex-col hidden md:flex fixed h-full z-10'>
        <div className='p-6 border-b border-slate-800'>
          <div className='flex items-center gap-2 text-green-400 mb-1'>
            <Shield className='h-6 w-6' />
            <span className='text-xl font-bold text-white tracking-tight'>
              RentGuard <span className='text-green-400'>AI</span>
            </span>
          </div>
          <p className='text-xs text-slate-400 font-medium'>Tenant Portal</p>
        </div>

        <nav className='flex-1 p-4 space-y-2'>
          <button
            onClick={() => setActiveView("overview")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm ${activeView === "overview" ? "bg-green-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
          >
            <LayoutDashboard className='h-5 w-5' /> My Leases
          </button>
          <button className='w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm text-slate-400 hover:bg-slate-800 hover:text-white'>
            <Settings className='h-5 w-5' /> Account Settings
          </button>
        </nav>

        <div className='p-4 border-t border-slate-800'>
          <div className='flex items-center gap-3 mb-4 px-2'>
            <div className='h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-green-400'>
              {user.name.charAt(0)}
            </div>
            <div>
              <p className='text-sm font-bold text-white leading-tight'>
                {user.name}
              </p>
              <p className='text-xs text-slate-400'>Verified Tenant</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className='w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-red-900/50 hover:text-red-400 text-slate-300 rounded-lg transition-colors text-sm font-bold'
          >
            <LogOut className='h-4 w-4' /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className='flex-1 ml-64 p-8 overflow-y-auto'>
        <header className='flex justify-between items-center mb-8'>
          <div>
            <h1 className='text-2xl font-bold text-slate-900'>
              Welcome home, {user.name.split(" ")[0]}
            </h1>
            <p className='text-slate-500 text-sm mt-1'>
              Manage your rental agreements and digital locker.
            </p>
          </div>
          <button className='p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-green-600 shadow-sm transition-colors relative'>
            <BellRing className='h-5 w-5' />
            {pendingActions > 0 && (
              <span className='absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white'></span>
            )}
          </button>
        </header>

        {/* DYNAMIC REMINDER UI */}
        {activeLeasesCount > 0 && (
          <div
            className={`rounded-xl shadow-md p-6 mb-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between animate-in slide-in-from-top-4 duration-500 ${hasManualPayments ? "bg-gradient-to-r from-rose-500 to-red-600" : "bg-gradient-to-r from-emerald-500 to-teal-600"}`}
          >
            <div className='flex items-center gap-4 mb-4 md:mb-0'>
              <div className='h-12 w-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shrink-0'>
                {hasManualPayments ? (
                  <Calendar className='h-6 w-6 text-white' />
                ) : (
                  <CheckCircle className='h-6 w-6 text-white' />
                )}
              </div>
              <div>
                <h3 className='text-lg font-bold flex items-center gap-2'>
                  {hasManualPayments
                    ? "Upcoming Rent Payment"
                    : "Autopay Scheduled"}
                  {hasManualPayments && (
                    <span className='bg-white text-red-600 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-black animate-pulse'>
                      Due Soon
                    </span>
                  )}
                </h3>
                <p className='text-white/90 text-sm mt-1'>
                  {hasManualPayments ? (
                    <>
                      Your monthly rent of{" "}
                      <strong className='text-white'>
                        ₹{totalMonthlyRent.toLocaleString("en-IN")}
                      </strong>{" "}
                      requires manual payment.
                    </>
                  ) : (
                    <>
                      Your rent of{" "}
                      <strong className='text-white'>
                        ₹{totalMonthlyRent.toLocaleString("en-IN")}
                      </strong>{" "}
                      will be safely auto-deducted.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className='flex w-full md:w-auto gap-3'>
              <Button
                variant='outline'
                className='flex-1 md:flex-none border-white/30 text-white hover:bg-white/10 bg-transparent transition-colors'
                onClick={() => alert("Mock Invoice Downloaded!")}
              >
                View Invoice
              </Button>

              {/* Only show the Pay button if they actually need to pay! */}
              {hasManualPayments && (
                <Button
                  className='flex-1 md:flex-none bg-white text-red-600 hover:bg-slate-50 shadow-sm font-bold'
                  onClick={() => setShowPaymentGateway(true)}
                >
                  Pay Now
                </Button>
              )}
            </div>
          </div>
        )}

        <div className='space-y-8 animate-in fade-in duration-500'>
          {/* KPI ROW */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4'>
              <div className='h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center'>
                <Building className='h-6 w-6 text-blue-600' />
              </div>
              <div>
                <p className='text-sm font-bold text-slate-500 uppercase tracking-wider'>
                  Active Homes
                </p>
                <p className='text-2xl font-bold text-slate-900'>
                  {activeLeasesCount}
                </p>
              </div>
            </div>

            <div className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4'>
              <div className='h-12 w-12 rounded-full bg-red-100 flex items-center justify-center'>
                <IndianRupee className='h-6 w-6 text-red-600' />
              </div>
              <div>
                <p className='text-sm font-bold text-slate-500 uppercase tracking-wider'>
                  Monthly Rent Payables
                </p>
                <p className='text-2xl font-bold text-slate-900'>
                  ₹{totalMonthlyRent.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div
              className={`p-6 rounded-xl border shadow-sm flex items-center gap-4 ${pendingActions > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}
            >
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center ${pendingActions > 0 ? "bg-amber-100" : "bg-slate-100"}`}
              >
                <AlertCircle
                  className={`h-6 w-6 ${pendingActions > 0 ? "text-amber-600" : "text-slate-400"}`}
                />
              </div>
              <div>
                <p
                  className={`text-sm font-bold uppercase tracking-wider ${pendingActions > 0 ? "text-amber-700" : "text-slate-500"}`}
                >
                  Pending Signatures
                </p>
                <p
                  className={`text-2xl font-bold ${pendingActions > 0 ? "text-amber-900" : "text-slate-900"}`}
                >
                  {pendingActions}
                </p>
              </div>
            </div>
          </div>

          {/* DIGITAL LOCKER */}
          <div className='bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden'>
            <div className='px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center'>
              <h3 className='font-bold text-lg text-slate-900 flex items-center gap-2'>
                <FileText className='h-5 w-5 text-green-600' /> My Digital
                Locker
              </h3>

              {/* 🔥 TENANT VAULT UPLOAD BUTTON */}
              <label className='cursor-pointer'>
                <input
                  type='file'
                  accept='application/pdf'
                  className='hidden'
                  onChange={handleFileSelect}
                />
                <div className='inline-flex items-center justify-center rounded-md text-sm font-bold transition-colors border border-green-600 bg-green-50 hover:bg-green-100 text-green-700 h-9 px-4 py-2 shadow-sm'>
                  + Upload External Contract
                </div>
              </label>
            </div>

            {leases.length === 0 ? (
              <div className='p-12 text-center flex flex-col items-center'>
                <div className='h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mb-4'>
                  <FileText className='h-10 w-10 text-slate-400' />
                </div>
                <h3 className='text-xl font-bold text-slate-900 mb-2'>
                  No agreements found.
                </h3>
                <p className='text-slate-500 max-w-md'>
                  When a landlord invites you to sign a lease, it will
                  automatically appear here in your secure locker.
                </p>
              </div>
            ) : (
              <div className='p-6'>
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                  {leases.map((lease) => (
                    <div
                      key={lease._id}
                      className='border border-slate-200 rounded-lg p-5 hover:border-green-300 hover:shadow-md transition-all flex flex-col justify-between'
                    >
                      <div>
                        <div className='flex justify-between items-start mb-3'>
                          {renderStatusBadge(lease.documentStatus)}
                          <span className='text-sm font-bold text-slate-700'>
                            ₹{lease.monthlyRent}/mo
                          </span>
                        </div>
                        <h4 className='font-bold text-slate-900 text-lg mb-1'>
                          Landlord:{" "}
                          {lease.landlordRelationName || "Property Owner"}
                        </h4>
                        <p className='text-sm text-slate-500 line-clamp-2 mb-4'>
                          <Building className='inline h-4 w-4 mr-1 text-slate-400' />
                          {lease.propertyAddress}
                        </p>

                        <div className='flex gap-4 text-sm text-slate-600 mb-6 bg-slate-50 p-3 rounded-md border border-slate-100'>
                          <div>
                            <span className='block text-xs text-slate-400 uppercase'>
                              Start Date
                            </span>
                            <span className='font-medium'>
                              {new Date(
                                lease.leaseStartDate,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span className='block text-xs text-slate-400 uppercase'>
                              Duration
                            </span>
                            <span className='font-medium'>
                              {lease.rentPeriodMonths} Months
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className='flex gap-2'>
                        <Button
                          variant='outline'
                          className='flex-1 text-slate-600 border-slate-300 hover:bg-slate-50'
                          onClick={() => {
                            if (!lease.pdfBase64)
                              return alert("PDF not ready yet.");

                            // 🔥 4. OPEN THE COMMAND CENTER!
                            setActiveCommandLease(lease);
                          }}
                        >
                          <Eye className='h-4 w-4 mr-2' /> View & Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      {/* 🔥 CUSTOM VAULT UPLOAD MODAL */}
      {showUploadModal && uploadFile && (
        <div className='fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200'>
          <div className='bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200'>
            <div className='flex items-center gap-4 mb-5 text-green-600'>
              <div className='h-12 w-12 bg-green-100 rounded-full flex items-center justify-center shrink-0'>
                <FileText className='h-6 w-6' />
              </div>
              <div>
                <h3 className='text-xl font-extrabold text-slate-900'>
                  Secure External Lease
                </h3>
                <p className='text-sm text-slate-500 mt-1'>
                  Add details for{" "}
                  <span className='font-medium text-slate-700'>
                    {uploadFile.name}
                  </span>
                </p>
              </div>
            </div>

            <div className='space-y-4 mb-6'>
              <div>
                <label className='block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2'>
                  Landlord / Broker Name
                </label>
                <input
                  type='text'
                  value={uploadLandlordName}
                  onChange={(e) => setUploadLandlordName(e.target.value)}
                  placeholder='e.g. Sharma Properties'
                  className='w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none transition-all'
                />
              </div>
              <div>
                <label className='block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2'>
                  Monthly Rent (₹)
                </label>
                <input
                  type='number'
                  value={uploadRentAmount}
                  onChange={(e) => setUploadRentAmount(e.target.value)}
                  placeholder='e.g. 25000'
                  className='w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none transition-all'
                />
              </div>
            </div>

            <div className='flex justify-end gap-3'>
              <Button
                variant='outline'
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                }}
                disabled={isUploading}
                className='text-slate-600 border-slate-300'
              >
                Cancel
              </Button>
              <Button
                onClick={confirmVaultUpload}
                disabled={isUploading || !uploadRentAmount}
                className='bg-green-600 hover:bg-green-700 text-white shadow-sm w-32'
              >
                {isUploading ? (
                  <Loader2 className='h-5 w-5 animate-spin' />
                ) : (
                  "Encrypt & Save"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 5. RENDER THE COMMAND CENTER MODAL */}
      {activeCommandLease && (
        <LeaseCommandCenter
          lease={activeCommandLease}
          userToken={user.token}
          onClose={() => setActiveCommandLease(null)}
        />
      )}
      {/* 🔥 RENDER PAYMENT GATEWAY MODAL */}
      {showPaymentGateway && (
        <div className='fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in'>
          {/* I'm assuming your existing PaymentGateway accepts amount, onSuccess, and onClose props. Adjust if needed! */}
          <PaymentGateway
            amount={totalMonthlyRent}
            onSuccess={() => {
              alert("Payment Successful! Rent receipt generated.");
              setShowPaymentGateway(false);
            }}
            onClose={() => setShowPaymentGateway(false)}
          />
        </div>
      )}
    </div>
  );
}
