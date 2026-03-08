"use client";
import LeaseWizard from "@/components/LeaseWizard";
import LeaseCommandCenter from "@/components/LeaseCommandCenter";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building,
  Users,
  IndianRupee,
  FileText,
  Shield,
  LogOut,
  PlusCircle,
  LayoutDashboard,
  Settings,
  BellRing,
  ChevronRight,
  Clock,
  CheckCircle,
  Link as LinkIcon,
  PenTool,
  Eye,
  Trash2,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandlordDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [leases, setLeases] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<"overview" | "forge">(
    "overview",
  );

  // Modal Tracking States
  const [leaseToDelete, setLeaseToDelete] = useState<string | null>(null);
  const [leaseToSign, setLeaseToSign] = useState<string | null>(null);
  const [signatureName, setSignatureName] = useState("");
  const [leaseToTerminate, setLeaseToTerminate] = useState<string | null>(null);
  const [activeCommandLease, setActiveCommandLease] = useState<any>(null);

  // Unified Link Hub States
  const [leaseForLinks, setLeaseForLinks] = useState<any>(null);
  const [tenantInviteUrl, setTenantInviteUrl] = useState<string | null>(null);
  const [witnessInviteUrl, setWitnessInviteUrl] = useState<string | null>(null);

  const fetchMyLeases = async (token: string) => {
    try {
      const res = await fetch(
        "http://rentguard-api.us-east-1.elasticbeanstalk.com/api/lease/my-leases",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

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

  // 1. Initial Load
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/auth");
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchMyLeases(JSON.parse(storedUser).token);
  }, [router]);

  // Keeps the main list fresh
  useEffect(() => {
    if (!leases || leases.length === 0 || !user) return;

    const hasPendingLeases = leases.some(
      (l: any) =>
        l.documentStatus === "Awaiting_Tenant" ||
        l.documentStatus === "Awaiting_Witness",
    );

    if (!hasPendingLeases) return;

    const intervalId = setInterval(() => {
      fetchMyLeases(user.token);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [leases, user]);

  // Instantly updates the Access Hub UI when open
  useEffect(() => {
    if (!leaseForLinks || !user) return;

    if (
      leaseForLinks.documentStatus !== "Awaiting_Tenant" &&
      leaseForLinks.documentStatus !== "Awaiting_Witness"
    ) {
      return;
    }

    const pollSingleLease = async () => {
      try {
        const res = await fetch(
          `http://rentguard-api.us-east-1.elasticbeanstalk.com/api/lease/${leaseForLinks._id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          },
        );

        if (res.ok) {
          const updatedLease = await res.json();
          if (updatedLease.documentStatus !== leaseForLinks.documentStatus) {
            setLeaseForLinks(updatedLease); // Visually updates the modal
            fetchMyLeases(user.token); // Sync the background list too
          }
        }
      } catch (error) {
        console.error("Polling error for Access Hub:", error);
      }
    };

    const intervalId = setInterval(pollSingleLease, 3000);
    return () => clearInterval(intervalId);
  }, [leaseForLinks, user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth");
  };

  // --- ACTIONS ---

  const confirmDelete = async () => {
    if (!leaseToDelete) return;
    try {
      const res = await fetch(
        `http://rentguard-api.us-east-1.elasticbeanstalk.com/api/lease/${leaseToDelete}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${user.token}` },
        },
      );
      if (res.ok) {
        fetchMyLeases(user.token);
        setLeaseToDelete(null);
      } else {
        alert("Failed to delete lease.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleESign = async () => {
    if (!leaseToSign || !signatureName.trim()) return;
    try {
      const res = await fetch(
        `http://rentguard-api.us-east-1.elasticbeanstalk.com/api/lease/${leaseToSign}/sign-landlord`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ signatureName }),
        },
      );
      if (res.ok) {
        fetchMyLeases(user.token);
        setLeaseToSign(null);
        setSignatureName("");
      } else {
        alert("Failed to sign lease.");
      }
    } catch (e) {
      console.error("E-Sign error:", e);
    }
  };

  const generateTenantLink = async (leaseId: string) => {
    try {
      const res = await fetch(
        `http://rentguard-api.us-east-1.elasticbeanstalk.com/api/lease/${leaseId}/invite`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${user.token}` },
        },
      );
      const data = await res.json();
      if (res.ok) setTenantInviteUrl(data.inviteUrl);
      else alert(data.error || "Failed to generate tenant link");
    } catch (e) {
      console.error(e);
    }
  };

  const generateWitnessLink = async (leaseId: string) => {
    try {
      const res = await fetch(
        `http://rentguard-api.us-east-1.elasticbeanstalk.com/api/lease/${leaseId}/invite-witness`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${user.token}` },
        },
      );
      const data = await res.json();
      if (res.ok) setWitnessInviteUrl(data.inviteUrl);
      else alert(data.error || "Failed to generate witness link");
    } catch (e) {
      console.error(e);
    }
  };

  const confirmTerminate = async () => {
    if (!leaseToTerminate) return;
    try {
      const res = await fetch(
        `http://rentguard-api.us-east-1.elasticbeanstalk.com/api/lease/${leaseToTerminate}/terminate`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${user.token}` },
        },
      );
      if (res.ok) {
        fetchMyLeases(user.token); // Refresh the list
        setLeaseToTerminate(null); // Close modal
      } else {
        alert("Failed to terminate lease.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Draft":
        return (
          <span className='bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit'>
            <FileText className='h-3 w-3' /> Draft
          </span>
        );
      case "Pending_Handshake":
        return (
          <span className='bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit'>
            <Clock className='h-3 w-3' /> Needs E-Sign
          </span>
        );
      case "Awaiting_Tenant":
        return (
          <span className='bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit'>
            <LinkIcon className='h-3 w-3' /> Awaiting Tenant
          </span>
        );
      case "Active":
        return (
          <span className='bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit'>
            <CheckCircle className='h-3 w-3' /> Active
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

  const activeLeasesCount = leases.filter(
    (l) => l.documentStatus === "Active",
  ).length;
  const pendingLeasesCount = leases.filter(
    (l) => l.documentStatus === "Pending_Handshake",
  ).length;
  const totalYield = leases
    .filter((l) => l.documentStatus === "Active")
    .reduce((sum, l) => sum + (l.monthlyRent || 0), 0);

  if (!user) return null;

  return (
    <div className='min-h-screen bg-slate-50 flex'>
      {/* 1. THE SIDEBAR */}
      <aside className='w-64 bg-slate-900 text-white flex flex-col hidden md:flex fixed h-full z-10'>
        <div className='p-6 border-b border-slate-800'>
          <div className='flex items-center gap-2 text-indigo-400 mb-1'>
            <Shield className='h-6 w-6' />
            <span className='text-xl font-bold text-white tracking-tight'>
              RentGuard <span className='text-indigo-400'>AI</span>
            </span>
          </div>
          <p className='text-xs text-slate-400 font-medium'>
            Landlord Command Center
          </p>
        </div>

        <nav className='flex-1 p-4 space-y-2'>
          <button
            onClick={() => setActiveView("overview")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm ${activeView === "overview" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
          >
            <LayoutDashboard className='h-5 w-5' /> Overview
          </button>

          <button
            onClick={() => setActiveView("forge")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all font-medium text-sm ${activeView === "forge" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
          >
            <div className='flex items-center gap-3'>
              <PlusCircle className='h-5 w-5' /> The Forge
            </div>
            {activeView !== "forge" && (
              <ChevronRight className='h-4 w-4 opacity-50' />
            )}
          </button>

          <button className='w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm text-slate-400 hover:bg-slate-800 hover:text-white'>
            <Settings className='h-5 w-5' /> Settings
          </button>
        </nav>

        <div className='p-4 border-t border-slate-800'>
          <div className='flex items-center gap-3 mb-4 px-2'>
            <div className='h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-indigo-400'>
              {user.name.charAt(0)}
            </div>
            <div>
              <p className='text-sm font-bold text-white leading-tight'>
                {user.name}
              </p>
              <p className='text-xs text-slate-400'>Verified Landlord</p>
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

      {/* 2. THE MAIN CONTENT AREA */}
      <main className='flex-1 ml-64 p-8 overflow-y-auto'>
        <header className='flex justify-between items-center mb-8'>
          <div>
            <h1 className='text-2xl font-bold text-slate-900'>
              {activeView === "overview"
                ? "Dashboard Overview"
                : "The Forge: Lease Creator"}
            </h1>
            <p className='text-slate-500 text-sm mt-1'>
              {activeView === "overview"
                ? "Manage your properties, tenants, and legal compliance."
                : "Draft a legally binding, 11-month Model Tenancy Act compliant agreement."}
            </p>
          </div>
          <div className='flex items-center gap-3'>
            <button className='p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-indigo-600 shadow-sm transition-colors'>
              <BellRing className='h-5 w-5' />
            </button>
            {activeView === "overview" && (
              <Button
                onClick={() => setActiveView("forge")}
                className='bg-indigo-600 hover:bg-indigo-700'
              >
                <PlusCircle className='mr-2 h-4 w-4' /> New Agreement
              </Button>
            )}
          </div>
        </header>

        {activeView === "overview" ? (
          <div className='space-y-8 animate-in fade-in duration-500'>
            {/* KPI ROW */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              <div className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4'>
                <div className='h-12 w-12 rounded-full bg-green-100 flex items-center justify-center'>
                  <IndianRupee className='h-6 w-6 text-green-600' />
                </div>
                <div>
                  <p className='text-sm font-bold text-slate-500 uppercase tracking-wider'>
                    Active Yield
                  </p>
                  <p className='text-2xl font-bold text-slate-900'>
                    ₹{totalYield.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <div className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4'>
                <div className='h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center'>
                  <Building className='h-6 w-6 text-blue-600' />
                </div>
                <div>
                  <p className='text-sm font-bold text-slate-500 uppercase tracking-wider'>
                    Active Leases
                  </p>
                  <p className='text-2xl font-bold text-slate-900'>
                    {activeLeasesCount}
                  </p>
                </div>
              </div>

              <div className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4'>
                <div className='h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center'>
                  <Users className='h-6 w-6 text-amber-600' />
                </div>
                <div>
                  <p className='text-sm font-bold text-slate-500 uppercase tracking-wider'>
                    Pending Signatures
                  </p>
                  <p className='text-2xl font-bold text-slate-900'>
                    {pendingLeasesCount}
                  </p>
                </div>
              </div>

              <div className='bg-slate-900 p-6 rounded-xl shadow-md flex items-center gap-4 relative overflow-hidden'>
                <Shield className='absolute -right-4 -bottom-4 h-24 w-24 text-indigo-500/20' />
                <div className='h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center z-10'>
                  <Shield className='h-6 w-6 text-indigo-400' />
                </div>
                <div className='z-10'>
                  <p className='text-sm font-bold text-indigo-200 uppercase tracking-wider'>
                    Shield Score
                  </p>
                  <p className='text-2xl font-bold text-white'>98%</p>
                </div>
              </div>
            </div>

            {/* DIGITAL LOCKER */}
            <div className='bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden'>
              <div className='px-6 py-5 border-b border-slate-200 bg-slate-50'>
                <h3 className='font-bold text-lg text-slate-900 flex items-center gap-2'>
                  <FileText className='h-5 w-5 text-indigo-600' />
                  Digital Locker
                </h3>
              </div>

              {leases.length === 0 ? (
                <div className='p-12 text-center flex flex-col items-center'>
                  <div className='h-24 w-24 bg-indigo-50 rounded-full flex items-center justify-center mb-4'>
                    <FileText className='h-10 w-10 text-indigo-400' />
                  </div>
                  <h3 className='text-xl font-bold text-slate-900 mb-2'>
                    Your locker is completely empty.
                  </h3>
                  <p className='text-slate-500 max-w-md mb-6'>
                    You have not drafted any rental agreements yet. Use The
                    Forge to create an AI-powered, law-compliant lease in
                    minutes.
                  </p>
                  <Button
                    onClick={() => setActiveView("forge")}
                    size='lg'
                    className='bg-indigo-600 hover:bg-indigo-700'
                  >
                    <PlusCircle className='mr-2 h-5 w-5' /> Draft First
                    Agreement
                  </Button>
                </div>
              ) : (
                <div className='p-6'>
                  <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                    {leases.map((lease) => (
                      <div
                        key={lease._id}
                        className='border border-slate-200 rounded-lg p-5 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between'
                      >
                        <div>
                          <div className='flex justify-between items-start mb-3'>
                            {renderStatusBadge(lease.documentStatus)}
                            <span className='text-sm font-bold text-slate-700'>
                              ₹{lease.monthlyRent}/mo
                            </span>
                          </div>
                          <h4 className='font-bold text-slate-900 text-lg'>
                            {lease.expectedTenantName}
                          </h4>
                          <p className='text-sm text-slate-500 line-clamp-1 mb-4'>
                            {lease.propertyAddress}
                          </p>

                          <div className='flex gap-4 text-sm text-slate-600 mb-6 bg-slate-50 p-3 rounded-md border border-slate-100'>
                            <div>
                              <span className='block text-xs text-slate-400 uppercase'>
                                Starts
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

                        {/* ACTION BUTTONS BASED ON STATUS */}
                        <div className='flex gap-2'>
                          <Button
                            variant='outline'
                            className='flex-1 text-slate-600 border-slate-300 hover:bg-slate-50'
                            onClick={() => {
                              if (!lease.pdfBase64)
                                return alert("PDF not ready yet.");
                              setActiveCommandLease(lease); // Opens the Command Center
                            }}
                          >
                            <Eye className='h-4 w-4 mr-2' /> View & Manage
                          </Button>

                          {lease.documentStatus === "Pending_Handshake" && (
                            <Button
                              onClick={() => setLeaseToSign(lease._id)}
                              className='flex-1 bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                            >
                              <PenTool className='h-4 w-4 mr-2' /> E-Sign
                            </Button>
                          )}

                          {/* UNIFIED LINK BUTTON */}
                          {(lease.documentStatus === "Awaiting_Tenant" ||
                            lease.documentStatus === "Awaiting_Witness") && (
                            <Button
                              onClick={() => {
                                setLeaseForLinks(lease);
                                setTenantInviteUrl(null);
                                setWitnessInviteUrl(null);
                              }}
                              className='flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                            >
                              <LinkIcon className='h-4 w-4 mr-2' /> Share Links
                            </Button>
                          )}

                          {(lease.documentStatus === "Awaiting_Tenant" ||
                            lease.documentStatus === "Awaiting_Witness" ||
                            lease.documentStatus === "Active") && (
                            <Button
                              variant='outline'
                              className='border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 px-3'
                              onClick={() => setLeaseToTerminate(lease._id)}
                            >
                              <Ban className='h-4 w-4' /> Terminate Agreement
                            </Button>
                          )}

                          {(lease.documentStatus === "Draft" ||
                            lease.documentStatus === "Terminated" ||
                            lease.documentStatus === "Pending_Handshake") && (
                            <Button
                              variant='outline'
                              className='border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 px-3'
                              onClick={() => setLeaseToDelete(lease._id)}
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className='animate-in slide-in-from-right-8 duration-500'>
            <LeaseWizard
              onSuccess={(data) => {
                setActiveView("overview");
                fetchMyLeases(user.token);
              }}
            />
          </div>
        )}

        {/* MODALS */}

        {/* CUSTOM DELETE CONFIRMATION MODAL */}
        {leaseToDelete && (
          <div className='fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200'>
            <div className='bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200 border border-slate-200'>
              <div className='flex items-center gap-4 mb-5 text-red-600'>
                <div className='h-12 w-12 bg-red-100 rounded-full flex items-center justify-center shrink-0'>
                  <Trash2 className='h-6 w-6' />
                </div>
                <div>
                  <h3 className='text-xl font-extrabold text-slate-900'>
                    Delete Document?
                  </h3>
                  <p className='text-sm text-slate-500 mt-1'>
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className='bg-slate-50 border border-slate-100 p-4 rounded-lg mb-6'>
                <p className='text-slate-600 text-sm'>
                  Are you sure you want to permanently erase this lease from
                  your Digital Locker? If you have already paid the E-Stamp
                  duty, you will lose the associated QR certification.
                </p>
              </div>

              <div className='flex justify-end gap-3'>
                <Button
                  variant='outline'
                  onClick={() => setLeaseToDelete(null)}
                  className='text-slate-600 border-slate-300 hover:bg-slate-50'
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDelete}
                  className='bg-red-600 hover:bg-red-700 text-white shadow-sm'
                >
                  Yes, Delete Forever
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOM TERMINATE MODAL */}
        {leaseToTerminate && (
          <div className='fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200'>
            <div className='bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200 border border-slate-200'>
              <div className='flex items-center gap-4 mb-5 text-red-600'>
                <div className='h-12 w-12 bg-red-100 rounded-full flex items-center justify-center shrink-0'>
                  <Ban className='h-6 w-6' />
                </div>
                <div>
                  <h3 className='text-xl font-extrabold text-slate-900'>
                    Revoke & Terminate?
                  </h3>
                  <p className='text-sm text-slate-500 mt-1'>
                    This will permanently lock the document.
                  </p>
                </div>
              </div>

              <div className='bg-red-50 border border-red-100 p-4 rounded-lg mb-6'>
                <p className='text-red-800 text-sm font-medium'>
                  Are you sure? Terminating this lease will immediately:
                </p>
                <ul className='list-disc list-inside text-red-700 text-sm mt-2 space-y-1'>
                  <li>Invalidate any pending Tenant or Witness links.</li>
                  <li>Block further cryptographic signatures.</li>
                  <li>Mark the document as legally void.</li>
                </ul>
              </div>

              <div className='flex justify-end gap-3'>
                <Button
                  variant='outline'
                  onClick={() => setLeaseToTerminate(null)}
                  className='text-slate-600 border-slate-300 hover:bg-slate-50'
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmTerminate}
                  className='bg-red-600 hover:bg-red-700 text-white shadow-sm'
                >
                  Yes, Terminate Lease
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOM E-SIGN MODAL */}
        {leaseToSign && (
          <div className='fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200'>
            <div className='bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200 border border-slate-200'>
              <div className='flex items-center gap-4 mb-5 text-indigo-600'>
                <div className='h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center shrink-0'>
                  <PenTool className='h-6 w-6' />
                </div>
                <div>
                  <h3 className='text-xl font-extrabold text-slate-900'>
                    Adopt E-Signature
                  </h3>
                  <p className='text-sm text-slate-500 mt-1'>
                    Legally bind yourself to this agreement.
                  </p>
                </div>
              </div>

              <div className='mb-6'>
                <label className='block text-sm font-bold text-slate-700 mb-2'>
                  Type your full legal name
                </label>
                <input
                  type='text'
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder='e.g. Rahul Sharma'
                  className='w-full border border-slate-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all'
                />

                {signatureName && (
                  <div className='mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-center'>
                    <p className='text-xs text-slate-400 uppercase font-bold tracking-wider mb-2'>
                      Signature Preview
                    </p>
                    <p className='font-serif italic text-3xl text-indigo-900'>
                      {signatureName}
                    </p>
                  </div>
                )}
              </div>

              <div className='flex justify-end gap-3'>
                <Button
                  variant='outline'
                  onClick={() => {
                    setLeaseToSign(null);
                    setSignatureName("");
                  }}
                  className='text-slate-600 border-slate-300'
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleESign}
                  disabled={!signatureName.trim()}
                  className='bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                >
                  Adopt & Sign
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* UNIFIED ACCESS & INVITES MODAL */}
        {leaseForLinks && (
          <div className='fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200'>
            <div className='bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200 border border-slate-200'>
              <div className='flex items-center gap-4 mb-6 text-indigo-600 border-b border-slate-100 pb-4'>
                <div className='h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center shrink-0'>
                  <LinkIcon className='h-6 w-6' />
                </div>
                <div>
                  <h3 className='text-xl font-extrabold text-slate-900'>
                    Access & Invites Hub
                  </h3>
                  <p className='text-sm text-slate-500 mt-1'>
                    Manage secure sharing links for this document.
                  </p>
                </div>
              </div>

              <div className='space-y-4 mb-6'>
                {/* 1. TENANT LINK SECTION */}
                <div
                  className={`border rounded-xl p-4 transition-all ${leaseForLinks.documentStatus === "Awaiting_Tenant" ? "border-indigo-300 bg-indigo-50/30" : "border-slate-200 bg-slate-50"}`}
                >
                  <div className='flex justify-between items-center mb-3'>
                    <div>
                      <h4
                        className={`font-bold ${leaseForLinks.documentStatus === "Awaiting_Tenant" ? "text-indigo-900" : "text-slate-700"}`}
                      >
                        1. Tenant Signature Link
                      </h4>
                      <p className='text-xs text-slate-500'>
                        Send this to {leaseForLinks.expectedTenantName}
                      </p>
                    </div>
                    {leaseForLinks.documentStatus === "Awaiting_Witness" ||
                    leaseForLinks.documentStatus === "Active" ? (
                      <span className='flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full'>
                        <CheckCircle className='h-3 w-3' /> Completed
                      </span>
                    ) : leaseForLinks.documentStatus === "Awaiting_Tenant" ? (
                      <span className='flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full'>
                        <Clock className='h-3 w-3' /> Action Required
                      </span>
                    ) : null}
                  </div>

                  {leaseForLinks.documentStatus === "Awaiting_Tenant" &&
                    (!tenantInviteUrl ? (
                      <Button
                        onClick={() => generateTenantLink(leaseForLinks._id)}
                        size='sm'
                        className='w-full bg-indigo-600 hover:bg-indigo-700'
                      >
                        Generate Secure Link
                      </Button>
                    ) : (
                      <div className='flex items-center gap-2'>
                        <input
                          type='text'
                          readOnly
                          value={tenantInviteUrl}
                          className='w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs outline-none text-slate-600'
                        />
                        <Button
                          size='sm'
                          onClick={() => {
                            navigator.clipboard.writeText(tenantInviteUrl);
                            alert("Copied!");
                          }}
                          className='bg-slate-900 hover:bg-slate-800'
                        >
                          Copy
                        </Button>
                      </div>
                    ))}
                </div>

                {/* 2. WITNESS LINK SECTION */}
                <div
                  className={`border rounded-xl p-4 transition-all ${leaseForLinks.documentStatus === "Awaiting_Witness" ? "border-fuchsia-300 bg-fuchsia-50/30" : "border-slate-200 bg-slate-50"}`}
                >
                  <div className='flex justify-between items-center mb-3'>
                    <div>
                      <h4
                        className={`font-bold ${leaseForLinks.documentStatus === "Awaiting_Witness" ? "text-fuchsia-900" : "text-slate-700"}`}
                      >
                        2. Witness Signature Link
                      </h4>
                      <p className='text-xs text-slate-500'>
                        One link serves both witnesses.
                      </p>
                    </div>
                    {leaseForLinks.documentStatus === "Active" ? (
                      <span className='flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full'>
                        <CheckCircle className='h-3 w-3' /> Completed
                      </span>
                    ) : leaseForLinks.documentStatus === "Awaiting_Tenant" ? (
                      <span className='flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded-full'>
                        <Shield className='h-3 w-3' /> Locked
                      </span>
                    ) : leaseForLinks.documentStatus === "Awaiting_Witness" ? (
                      <span className='flex items-center gap-1 text-xs font-bold text-fuchsia-600 bg-fuchsia-100 px-2 py-1 rounded-full'>
                        <Clock className='h-3 w-3' /> Action Required
                      </span>
                    ) : null}
                  </div>

                  {leaseForLinks.documentStatus === "Awaiting_Witness" &&
                    (!witnessInviteUrl ? (
                      <Button
                        onClick={() => generateWitnessLink(leaseForLinks._id)}
                        size='sm'
                        className='w-full bg-fuchsia-600 hover:bg-fuchsia-700'
                      >
                        Generate Secure Link
                      </Button>
                    ) : (
                      <div className='flex items-center gap-2'>
                        <input
                          type='text'
                          readOnly
                          value={witnessInviteUrl}
                          className='w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs outline-none text-slate-600'
                        />
                        <Button
                          size='sm'
                          onClick={() => {
                            navigator.clipboard.writeText(witnessInviteUrl);
                            alert("Copied!");
                          }}
                          className='bg-slate-900 hover:bg-slate-800'
                        >
                          Copy
                        </Button>
                      </div>
                    ))}
                  {leaseForLinks.documentStatus === "Awaiting_Tenant" && (
                    <p className='text-xs text-slate-400 italic mt-2'>
                      This link will unlock automatically after the tenant signs
                      the document.
                    </p>
                  )}
                </div>
              </div>

              <div className='flex justify-end'>
                <Button
                  onClick={() => setLeaseForLinks(null)}
                  className='bg-slate-200 hover:bg-slate-300 text-slate-800'
                >
                  Close Hub
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
      {/* DROP THE COMMAND CENTER RIGHT HERE, BEFORE THE FINAL </div> */}
      {activeCommandLease && (
        <LeaseCommandCenter
          lease={activeCommandLease}
          userToken={user.token}
          role='landlord'
          onTerminate={(leaseId: string) => setLeaseToTerminate(leaseId)}
          onClose={() => setActiveCommandLease(null)}
        />
      )}
    </div>
  );
}
