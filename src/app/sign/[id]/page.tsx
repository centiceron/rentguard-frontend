"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ShieldCheck,
  FileSignature,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SignatureRoom() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [leaseDetails, setLeaseDetails] = useState<any>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [success, setSuccess] = useState(false);

  // To check if they have Aadhaar KYC
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/auth");
      return;
    }

    setUser(JSON.parse(storedUser));

    const fetchFullLease = async () => {
      try {
        const res = await fetch(
          `http://rentguard-api.us-east-1.elasticbeanstalk.com/api/lease/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await res.json();
        if (res.ok) setLeaseDetails(data.lease);
      } catch (error) {
        console.error("Failed to fetch secure lease");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchFullLease();
  }, [id, router]);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://rentguard-api.us-east-1.elasticbeanstalk.com/api/lease/handshake",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ leaseId: id }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push("/tenant/dashboard"), 2000);
      } else {
        alert(data.error || "Handshake failed.");
        setIsAccepting(false);
      }
    } catch (error) {
      setIsAccepting(false);
    }
  };

  if (loading)
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-50'>
        <ShieldCheck className='text-indigo-500 animate-spin h-8 w-8' />
      </div>
    );

  return (
    <div className='min-h-screen bg-slate-900 flex flex-col items-center py-12 px-4'>
      <div className='mb-8 text-center text-white'>
        <h1 className='text-3xl font-black'>Secure Signature Room</h1>
        <p className='text-slate-400 mt-2'>
          Review the document carefully before applying your cryptographic
          signature.
        </p>
      </div>

      <Card className='w-full max-w-4xl border-slate-700 bg-slate-800 text-white shadow-2xl relative overflow-hidden'>
        {success && (
          <div className='absolute inset-0 bg-slate-900/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in'>
            <CheckCircle className='h-20 w-20 text-green-500 mb-4' />
            <h2 className='text-2xl font-bold'>
              Cryptographic Handshake Complete
            </h2>
          </div>
        )}

        <CardContent className='pt-6'>
          <div className='bg-slate-300 p-2 rounded-lg mb-6 max-h-[60vh] overflow-y-auto'>
            {leaseDetails?.pdfBase64 && (
              <iframe
                src={`data:application/pdf;base64,${leaseDetails.pdfBase64}`}
                width='100%'
                height='600px'
                className='rounded-md bg-white'
              />
            )}
          </div>

          {/* KYC Safety Check before showing the Accept button */}
          {!user?.isAadhaarVerified ? (
            <div className='bg-red-900/50 border border-red-500 p-4 rounded-lg flex items-start gap-4'>
              <AlertTriangle className='h-6 w-6 text-red-400 shrink-0' />
              <div>
                <h3 className='font-bold text-red-200'>
                  KYC Verification Required
                </h3>
                <p className='text-sm text-red-300 mt-1'>
                  Your account is missing Aadhaar Verification. You cannot sign
                  legal documents until your identity is verified.
                </p>
              </div>
            </div>
          ) : (
            <Button
              onClick={handleAccept}
              disabled={isAccepting || leaseDetails?.tenantId}
              className='w-full h-14 text-lg bg-green-600 hover:bg-green-700 text-white shadow-lg'
            >
              <FileSignature className='mr-2 h-5 w-5' />
              {isAccepting
                ? "Executing Ledger Entry..."
                : leaseDetails?.tenantId
                  ? "Document Already Signed"
                  : "I Agree & Sign Document"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
