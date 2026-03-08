"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  ShieldAlert,
  ShieldCheck,
  Loader2,
  Building,
  Mail,
  ArrowRight,
  PenTool,
  Eye,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InviteGateway() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const leaseId = params.id as string;
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaseData, setLeaseData] = useState<any>(null); // Public safe data
  const [fullLease, setFullLease] = useState<any>(null); // The actual PDF (if authorized)

  const [user, setUser] = useState<any>(null);
  const [signatureName, setSignatureName] = useState("");
  const [signing, setSigning] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!leaseId || !token) {
      setError("Malformed invite link. Missing security parameters.");
      setLoading(false);
      return;
    }

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchFullLease(parsedUser.token); // If logged in, try to fetch the real deal
    } else {
      verifyTokenPublic(); // If logged out, just get the public preview
    }
  }, [leaseId, token]);

  const verifyTokenPublic = async () => {
    try {
      const res = await fetch(
        `http://rentguard-api.us-east-1.elasticbeanstalk.com/api/lease/${leaseId}/verify-invite?token=${token}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify link.");
      setLeaseData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFullLease = async (authToken: string) => {
    try {
      const res = await fetch(
        `http://rentguard-api.us-east-1.elasticbeanstalk.com/api/lease/${leaseId}/tenant-view?token=${token}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Identity mismatch. Access Denied.");

      setFullLease(data.lease);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const proceedToLogin = () => {
    // 🔥 FIXED: Set to "returnTo" so the Auth page picks it up!
    sessionStorage.setItem("returnTo", `/invite/${leaseId}?token=${token}`);
    router.push("/auth?action=signup"); // Force them to the signup/login page
  };

  const handleSign = async () => {
    if (!signatureName.trim()) return;
    setSigning(true);
    try {
      const res = await fetch(
        `http://rentguard-api.us-east-1.elasticbeanstalk.com/api/lease/${leaseId}/sign-tenant?token=${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ signatureName }),
        },
      );
      if (!res.ok) throw new Error("Failed to sign document.");

      setSuccess(true);
      setTimeout(() => router.push("/tenant/dashboard"), 3000); // Redirect to their new dashboard!
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSigning(false);
    }
  };

  const viewPdf = () => {
    if (!fullLease?.pdfBase64) return;
    const byteCharacters = atob(fullLease.pdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const blob = new Blob([new Uint8Array(byteNumbers)], {
      type: "application/pdf",
    });
    window.open(URL.createObjectURL(blob), "_blank");
  };

  if (loading)
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center'>
        <Loader2 className='animate-spin h-10 w-10 text-indigo-600' />
      </div>
    );

  if (error) {
    return (
      <div className='min-h-screen bg-slate-50 flex items-center justify-center p-4'>
        <div className='bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border-t-4 border-red-500'>
          <ShieldAlert className='h-16 w-16 text-red-500 mx-auto mb-4' />
          <h2 className='text-2xl font-extrabold text-slate-900 mb-2'>
            Access Denied
          </h2>
          <p className='text-slate-600 mb-6'>{error}</p>
          {user && (
            <Button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              variant='outline'
            >
              Sign out & Try Another Account
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className='min-h-screen bg-green-50 flex flex-col items-center justify-center p-4 text-center'>
        <div className='h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mb-6'>
          <CheckCircle className='h-12 w-12 text-green-600' />
        </div>
        <h2 className='text-3xl font-extrabold text-slate-900 mb-2'>
          Lease Successfully Executed!
        </h2>
        <p className='text-slate-600'>
          The document is now legally binding and has been added to your Digital
          Locker.
        </p>
        <p className='text-sm text-slate-400 mt-4'>
          Redirecting to your dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden'>
      <div className='absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/20 blur-3xl rounded-full' />
      <div className='bg-white p-8 md:p-10 rounded-2xl shadow-2xl max-w-lg w-full relative z-10 animate-in zoom-in-95 duration-500'>
        {/* LOGGED OUT STATE (The Bouncer) */}
        {!user ? (
          <>
            <div className='flex justify-center mb-6'>
              <div className='bg-green-100 p-3 rounded-full'>
                <ShieldCheck className='h-8 w-8 text-green-600' />
              </div>
            </div>
            <h1 className='text-2xl font-extrabold text-slate-900 text-center mb-2'>
              Secure Document Gateway
            </h1>
            <p className='text-slate-500 text-center mb-8'>
              You have been invited to electronically sign a legal agreement.
            </p>

            <div className='bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8 space-y-4'>
              <div className='flex items-start gap-3'>
                <Building className='h-5 w-5 text-indigo-500 shrink-0' />
                <div>
                  <p className='text-xs font-bold text-slate-400 uppercase'>
                    Property
                  </p>
                  <p className='text-slate-800 font-medium'>
                    {leaseData?.propertyAddress}
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={proceedToLogin}
              className='w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all group'
            >
              Verify Identity & View Document{" "}
              <ArrowRight className='ml-2 h-5 w-5 group-hover:translate-x-1' />
            </Button>
          </>
        ) : (
          /* LOGGED IN STATE (The Vault) */
          <>
            <div className='flex items-center gap-3 mb-6 border-b border-slate-100 pb-4'>
              <div className='h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center shrink-0'>
                <PenTool className='h-6 w-6 text-indigo-600' />
              </div>
              <div>
                <h1 className='text-xl font-extrabold text-slate-900 leading-tight'>
                  Adopt E-Signature
                </h1>
                <p className='text-sm text-slate-500 flex items-center gap-1'>
                  <ShieldCheck className='h-3 w-3 text-green-600' /> Verified as{" "}
                  {user.email}
                </p>
              </div>
            </div>

            <div className='mb-6'>
              <Button
                onClick={viewPdf}
                variant='outline'
                className='w-full h-12 border-indigo-200 text-indigo-700 hover:bg-indigo-50 bg-indigo-50/50'
              >
                <Eye className='mr-2 h-5 w-5' /> Review Full Document PDF
              </Button>
            </div>

            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-bold text-slate-700 mb-2'>
                  Type your full legal name to sign
                </label>
                <input
                  type='text'
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder={`e.g. ${fullLease?.expectedTenantName}`}
                  className='w-full border border-slate-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-indigo-500 outline-none'
                />
              </div>

              {signatureName && (
                <div className='p-4 bg-slate-50 border border-slate-200 rounded-lg text-center animate-in fade-in'>
                  <p className='text-xs text-slate-400 uppercase font-bold mb-2'>
                    Signature Preview
                  </p>
                  <p className='font-serif italic text-3xl text-green-800'>
                    {signatureName}
                  </p>
                </div>
              )}

              <Button
                onClick={handleSign}
                disabled={!signatureName.trim() || signing}
                className='w-full h-12 bg-green-600 hover:bg-green-700 text-lg shadow-md mt-4'
              >
                {signing ? (
                  <Loader2 className='animate-spin h-5 w-5 mx-auto' />
                ) : (
                  "Agree & Sign Document"
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
