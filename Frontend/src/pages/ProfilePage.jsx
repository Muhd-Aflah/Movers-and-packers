import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  LayoutDashboard,
  Loader2,
  Mail,
  Pencil,
  Phone,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { getAuthFromStorage, setAuth } from "../utils/auth";
import { apiRequest } from "../services/api";

const ROLE_LABELS = { user: "Customer", mover: "Mover", admin: "Administrator" };
const cardClass = "rounded-card border border-border bg-card text-card-foreground shadow-sm";
const inputClass = "min-h-12 w-full rounded-xl border border-slate-400 bg-white pl-11 pr-4 text-[15px] font-medium text-slate-900 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-500 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400 dark:ring-offset-slate-900";
const EMPTY_PROFILE = { name: "", email: "", phone: "" };

function InfoRow({ icon: Icon, label, value, placeholder = "Not added yet" }) {
  return (
    <div className="flex items-start gap-4 py-4">
      <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">{label}</dt>
        <dd className="mt-0.5 break-words text-[15px] font-semibold text-slate-900 dark:text-slate-50">
          {value || <span className="font-medium text-slate-500 dark:text-slate-400">{placeholder}</span>}
        </dd>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div role="status" aria-label="Loading profile" className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10">
      <div className={`${cardClass} overflow-hidden`}>
        <div className="h-32 animate-pulse bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-3 p-6 pt-14">
          <div className="h-6 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-64 max-w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className={`${cardClass} h-64 animate-pulse md:col-span-2`} />
        <div className={`${cardClass} h-64 animate-pulse`} />
      </div>
    </div>
  );
}

function Message({ children, success = false }) {
  const Icon = success ? CheckCircle2 : AlertCircle;
  return (
    <div
      role={success ? "status" : "alert"}
      className={`flex items-start gap-3 rounded-xl p-4 text-sm font-medium ${success
        ? "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200"
        : "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200"}`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

export function ProfilePage() {
  const { token, user, role } = getAuthFromStorage();
  const userId = user?._id;
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [savedProfile, setSavedProfile] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    if (!token || !userId) {
      setError("Could not identify this account. Please sign in again.");
      setLoading(false);
      return () => controller.abort();
    }

    setLoading(true);
    setError("");
    apiRequest(`/api/users/${encodeURIComponent(userId)}`, { signal: controller.signal })
      .then((data) => {
        if (!active) return;
        const loadedProfile = {
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
        };
        setProfile(loadedProfile);
        setSavedProfile(loadedProfile);
      })
      .catch((requestError) => {
        if (active && requestError.name !== "AbortError") setError(requestError.message || "Could not load profile.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [token, userId, reloadKey]);

  const dirty = profile.name !== savedProfile.name || profile.phone !== savedProfile.phone;
  const roleLabel = ROLE_LABELS[role] || role || "Account";
  const displayName = profile.name || savedProfile.name || "Your account";
  const initial = (profile.name || profile.email || "?").trim().charAt(0).toUpperCase() || "?";

  function updateField(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccess("");
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!profile.name.trim()) {
      setError("Please enter your name.");
      document.getElementById("profile-name")?.focus();
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const updatedUser = await apiRequest(`/api/users/${encodeURIComponent(userId)}`, {
        method: "PUT",
        body: JSON.stringify({ name: profile.name.trim(), phone: profile.phone.trim() }),
      });
      const nextProfile = {
        name: updatedUser.name || "",
        email: updatedUser.email || "",
        phone: updatedUser.phone || "",
      };
      setProfile(nextProfile);
      setSavedProfile(nextProfile);
      setAuth({ token, user: { ...user, ...updatedUser } });
      setSuccess("Profile saved.");
      setIsEditing(false);
    } catch (requestError) {
      setError(requestError.message || "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setProfile(savedProfile);
    setIsEditing(false);
    setError("");
    setSuccess("");
  }

  async function copyUserId() {
    if (!userId || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(String(userId));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (loading) return <ProfileSkeleton />;

  if (error && !savedProfile.email && !savedProfile.name) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-5 px-4 py-10">
        <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-slate-50">Your profile</h1>
        <Message>{error}</Message>
        {token && userId && (
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:py-10">
        <section className={`${cardClass} overflow-hidden`} aria-labelledby="profile-heading">
          <div
            className="h-32 bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950"
            aria-hidden="true"
          />
          <div className="flex flex-col gap-5 px-5 pb-6 sm:flex-row sm:items-end sm:justify-between sm:px-6">
            <div className="-mt-12 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
              <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-blue-600 text-4xl font-extrabold text-white ring-4 ring-white dark:ring-slate-900" aria-hidden="true">
                {initial}
              </div>
              <div className="min-w-0 sm:pb-1">
                <h1 id="profile-heading" className="font-display text-2xl font-extrabold leading-8 tracking-tight text-slate-900 dark:text-slate-50">
                  {displayName}
                </h1>
                <p className="mt-0.5 break-all text-[15px] text-slate-600 dark:text-slate-300">{profile.email}</p>
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-900 dark:bg-blue-950 dark:text-blue-200">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />{roleLabel}
                </span>
              </div>
            </div>
            {!isEditing && (
              <button
                type="button"
                onClick={() => { setIsEditing(true); setError(""); setSuccess(""); }}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:ring-offset-slate-900 sm:w-auto"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />Edit profile
              </button>
            )}
          </div>
        </section>

        {error && <Message>{error}</Message>}
        {success && <Message success>{success}</Message>}

        <div className="grid gap-6 md:grid-cols-3">
          <section className={`${cardClass} min-w-0 p-5 sm:p-6 md:col-span-2`} aria-labelledby="personal-heading">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="personal-heading" className="font-display text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-50">Personal information</h2>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                  {isEditing ? "Update your name and contact number." : "Your name and contact details."}
                </p>
              </div>
              {isEditing && dirty && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">Unsaved changes</span>
              )}
            </div>

            {!isEditing ? (
              <dl className="mt-2 divide-y divide-slate-200 dark:divide-slate-700">
                <InfoRow icon={User} label="Full name" value={savedProfile.name} />
                <InfoRow icon={Mail} label="Email address" value={savedProfile.email} />
                <InfoRow icon={Phone} label="Phone number" value={savedProfile.phone} placeholder="Add a contact number" />
              </dl>
            ) : (
              <form className="mt-6 space-y-5" onSubmit={handleSave}>
                <div>
                  <label htmlFor="profile-name" className="mb-1.5 block text-[13px] font-semibold text-slate-800 dark:text-slate-200">Full name</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                    <input id="profile-name" type="text" autoComplete="name" maxLength={120} required aria-invalid={Boolean(error && !profile.name.trim())} value={profile.name} onChange={(event) => updateField("name", event.target.value)} className={inputClass} />
                  </div>
                </div>

                <div>
                  <label htmlFor="profile-email" className="mb-1.5 block text-[13px] font-semibold text-slate-800 dark:text-slate-200">Email address</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                    <input id="profile-email" type="email" autoComplete="email" value={profile.email} disabled aria-describedby="email-note" className={`${inputClass} cursor-not-allowed bg-slate-100 dark:bg-slate-800`} />
                  </div>
                  <p id="email-note" className="mt-1.5 text-[13px] text-slate-600 dark:text-slate-300">Your email cannot be changed from this page.</p>
                </div>

                <div>
                  <label htmlFor="profile-phone" className="mb-1.5 block text-[13px] font-semibold text-slate-800 dark:text-slate-200">Phone number</label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                    <input id="profile-phone" type="tel" autoComplete="tel" maxLength={30} value={profile.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="Your contact number" className={inputClass} />
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-700 sm:flex-row sm:justify-end">
                  <button type="button" onClick={cancelEdit} disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-400 bg-white px-5 text-sm font-semibold text-slate-900 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60 dark:border-slate-500 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:ring-offset-slate-900">
                    <X className="h-4 w-4" aria-hidden="true" />Cancel
                  </button>
                  <button type="submit" disabled={saving || !dirty} className="inline-flex min-h-11 min-w-32 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55 dark:ring-offset-slate-900">
                    {saving ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Saving...</> : <><Check className="h-4 w-4" aria-hidden="true" />Save changes</>}
                  </button>
                </div>
              </form>
            )}
          </section>

          <aside className="space-y-6" aria-label="Account details">
            <section className={`${cardClass} min-w-0 p-5 sm:p-6`}>
              <h2 className="font-display text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-50">Account</h2>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">Account type</dt>
                  <dd className="mt-0.5 font-semibold text-slate-900 dark:text-slate-50">{roleLabel}</dd>
                </div>
                <div>
                  <dt className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">User ID</dt>
                  <dd className="mt-1 flex min-w-0 items-center gap-2">
                    <code className="min-w-0 flex-1 break-all rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">{userId}</code>
                    <button type="button" onClick={copyUserId} aria-label={copied ? "User ID copied" : "Copy user ID"} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
                      {copied ? <Check className="h-4 w-4 text-green-700 dark:text-green-400" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </dd>
                </div>
              </dl>
              <span className="sr-only" role="status" aria-live="polite">{copied ? "User ID copied" : ""}</span>
            </section>

            <section className={`${cardClass} p-5 sm:p-6`}>
              <h2 className="font-display text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-50">Quick links</h2>
              <Link to="/dashboard" className="mt-4 flex min-h-11 items-center gap-3 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-900 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800">
                <LayoutDashboard className="h-4 w-4 text-blue-700 dark:text-blue-300" aria-hidden="true" />Go to dashboard
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
