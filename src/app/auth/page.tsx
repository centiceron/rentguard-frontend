"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  UserPlus,
  LogIn,
  Lock,
  Mail,
  MapPin,
  FileDigit,
  Building,
  User,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // The Zero-Trust State
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    phoneNumber: "",
    role: "tenant", // Default role
    // These fields remain empty until DigiLocker fills them
    verifiedName: "",
    aadhaarNumber: "",
    address: "",
  });

  useEffect(() => {
    // Check if they arrived via the "Create Account" button on the landing page
    if (
      typeof window !== "undefined" &&
      window.location.search.includes("action=signup")
    ) {
      setIsLogin(false);
    }

    // Auto-redirect if already logged in
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      const user = JSON.parse(storedUser);
      router.push(
        user.role === "landlord" ? "/landlord/dashboard" : "/tenant/dashboard",
      );
    }
  }, [router]);

  // 🔥 THE MAGIC: Opening the Simulator and catching the data
  const handleDigilockerPopup = () => {
    setError("");
    const popup = window.open(
      "/sandbox/digilocker",
      "DigiLocker Auth",
      "width=500,height=600,left=200,top=200",
    );

    const messageListener = (event: MessageEvent) => {
      if (event.data?.type === "DIGILOCKER_SUCCESS") {
        const payload = event.data.payload;

        // Auto-fill the state with verified data!
        setFormData((prev) => ({
          ...prev,
          verifiedName: payload.name,
          aadhaarNumber: payload.aadhaar,
          address: payload.address,
        }));

        setIsAadhaarVerified(true);
        window.removeEventListener("message", messageListener);
      } else if (event.data?.type === "DIGILOCKER_FAILED") {
        setError(event.data.error || "Verification failed.");
        window.removeEventListener("message", messageListener);
      }
    };

    window.addEventListener("message", messageListener);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

    // For registration, map verifiedName to the 'name' field your backend expects
    const payload = isLogin
      ? {
          email: formData.email,
          password: formData.password,
        }
      : {
          name: formData.verifiedName, // Mapped from DigiLocker
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
          role: formData.role,
          aadhaarNumber: formData.aadhaarNumber,
          verifiedName: formData.verifiedName,
          address: formData.address,
        };

    try {
      const res = await fetch(`${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data));

        // Route them to their respective dashboard
        const destination =
          data.role === "landlord"
            ? "/landlord/dashboard"
            : "/tenant/dashboard";

        const returnUrl = sessionStorage.getItem("returnTo");
        if (returnUrl) {
          sessionStorage.removeItem("returnTo");
          router.push(returnUrl);
        } else {
          router.push(destination);
        }
      } else {
        setError(data.error || "Authentication failed");
      }
    } catch (err) {
      setError("Server connection failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4'>
      <div className='w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden'>
        <div className='bg-slate-900 px-6 py-8 text-center'>
          <ShieldCheck className='h-12 w-12 text-indigo-400 mx-auto mb-3' />
          <h2 className='text-2xl font-bold text-white'>
            {isLogin ? "Welcome Back" : "Secure Account Setup"}
          </h2>
          <p className='text-slate-400 mt-2 text-sm'>
            {isLogin
              ? "Enter your credentials to access your vault."
              : "Zero-Trust Identity Verification required."}
          </p>
        </div>

        <div className='p-6'>
          {error && (
            <div className='mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm text-center'>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Standard Credentials */}
            <div className='space-y-4'>
              <div className='space-y-1'>
                <Label>Email Address</Label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-3 h-4 w-4 text-slate-400' />
                  <Input
                    type='email'
                    required
                    className='pl-10'
                    placeholder='name@example.com'
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className='space-y-1'>
                <Label>Password</Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-3 h-4 w-4 text-slate-400' />
                  <Input
                    type='password'
                    required
                    className='pl-10'
                    placeholder='••••••••'
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Registration Specific Fields */}
            {!isLogin && (
              <div className='space-y-6 pt-4 border-t border-slate-100'>
                <div className='space-y-1'>
                  <Label>Phone Number</Label>
                  <div className='relative'>
                    <Smartphone className='absolute left-3 top-3 h-4 w-4 text-slate-400' />
                    <Input
                      type='tel'
                      required
                      className='pl-10'
                      placeholder='e.g. 9876543210'
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phoneNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label>I am registering as a:</Label>
                  <div className='grid grid-cols-2 gap-4'>
                    <div
                      onClick={() =>
                        setFormData({ ...formData, role: "tenant" })
                      }
                      className={`cursor-pointer p-3 rounded-lg border-2 text-center transition-all ${formData.role === "tenant" ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-bold" : "border-slate-200 hover:border-slate-300 text-slate-600"}`}
                    >
                      <User className='h-5 w-5 mx-auto mb-1' />
                      Tenant
                    </div>
                    <div
                      onClick={() =>
                        setFormData({ ...formData, role: "landlord" })
                      }
                      className={`cursor-pointer p-3 rounded-lg border-2 text-center transition-all ${formData.role === "landlord" ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-bold" : "border-slate-200 hover:border-slate-300 text-slate-600"}`}
                    >
                      <Building className='h-5 w-5 mx-auto mb-1' />
                      Landlord
                    </div>
                  </div>
                </div>

                {/* The Identity Gateway */}
                {!isAadhaarVerified ? (
                  <div className='bg-slate-50 p-4 rounded-lg border border-slate-200 text-center space-y-3'>
                    <ShieldCheck className='h-8 w-8 text-slate-400 mx-auto' />
                    <p className='text-sm text-slate-600'>
                      You must verify your identity to continue.
                    </p>
                    <Button
                      type='button'
                      onClick={handleDigilockerPopup}
                      className='w-full bg-green-600 hover:bg-green-700'
                    >
                      Verify with DigiLocker
                    </Button>
                  </div>
                ) : (
                  <div className='space-y-4 animate-in fade-in zoom-in-95 duration-300'>
                    <div className='bg-green-50 text-green-700 p-3 rounded-lg border border-green-200 flex items-center justify-center text-sm font-bold'>
                      <ShieldCheck className='h-5 w-5 mr-2' /> Identity Verified
                    </div>

                    {/* Auto-filled, Locked Fields */}
                    <div className='space-y-3'>
                      <div className='relative'>
                        <User className='absolute left-3 top-3 h-4 w-4 text-slate-400' />
                        <Input
                          readOnly
                          className='pl-10 bg-slate-100 border-slate-200 text-slate-500 font-medium cursor-not-allowed'
                          value={formData.verifiedName}
                        />
                      </div>
                      <div className='relative'>
                        <FileDigit className='absolute left-3 top-3 h-4 w-4 text-slate-400' />
                        <Input
                          readOnly
                          className='pl-10 bg-slate-100 border-slate-200 text-slate-500 font-medium cursor-not-allowed'
                          value={`Aadhaar: ${formData.aadhaarNumber}`}
                        />
                      </div>
                      <div className='relative'>
                        <MapPin className='absolute left-3 top-3 h-4 w-4 text-slate-400' />
                        <Input
                          readOnly
                          className='pl-10 bg-slate-100 border-slate-200 text-slate-500 font-medium cursor-not-allowed text-ellipsis'
                          value={formData.address}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button
              type='submit'
              disabled={loading || (!isLogin && !isAadhaarVerified)}
              className='w-full bg-slate-900 hover:bg-slate-800 h-12 text-lg mt-6'
            >
              {loading
                ? "Authenticating..."
                : isLogin
                  ? "Log In"
                  : "Create Secure Account"}
            </Button>
          </form>
        </div>

        <div className='px-6 py-4 bg-slate-50 border-t border-slate-100 text-center'>
          <button
            type='button'
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className='text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors'
          >
            {isLogin
              ? "Need an account? Sign up securely"
              : "Already verified? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}
