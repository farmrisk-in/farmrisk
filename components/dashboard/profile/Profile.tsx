"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/hooks/useLanguage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Camera,
  Save,
  LoaderCircle,
  ShieldCheck,
  Upload,
  Trash2,
  Crop,
  ZoomIn,
  ZoomOut,
  Mail,
  KeyRound,
  Lock,
} from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const {
    profile,
    isLoading,
    updateProfile,
    isUpdating,
    updatePassword,
    isUpdatingPassword,
  } = useProfile();
  const { language } = useLanguage();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState<string>("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Change Password Dialog States
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Crop & Resize Modal States
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const cropImgRef = useRef<HTMLImageElement>(null);

  // Sync profile data when loaded via TanStack Query
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setPhone(profile.phone || "");
      setAge(profile.age ? String(profile.age) : "");
      setLocation(profile.location || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  // Step 1: File selection triggers crop dialog
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(
        language === "hi"
          ? "कृपया एक वैध छवि फ़ाइल चुनें"
          : "Please select a valid image file",
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setRawImageSrc(reader.result as string);
        setZoom(1);
        setIsCropOpen(true);
      }
    };
    reader.readAsDataURL(file);

    // Reset input so re-selecting same file works
    e.target.value = "";
  };

  // Step 2: Auto Crop, Resize to 300x300, and Compress to JPEG (~30KB)
  const handleApplyCropAndCompress = useCallback(() => {
    const img = cropImgRef.current;
    if (!img) return;

    const canvas = document.createElement("canvas");
    const targetSize = 300; // 300x300 avatar size
    canvas.width = targetSize;
    canvas.height = targetSize;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Center crop with zoom level
    const minDim = Math.min(img.naturalWidth, img.naturalHeight);
    const cropSize = minDim / zoom;
    const cropX = (img.naturalWidth - cropSize) / 2;
    const cropY = (img.naturalHeight - cropSize) / 2;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, targetSize, targetSize);
    ctx.drawImage(
      img,
      cropX,
      cropY,
      cropSize,
      cropSize,
      0,
      0,
      targetSize,
      targetSize,
    );

    // Compress to 80% JPEG
    const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setAvatarUrl(compressedDataUrl);
    setIsCropOpen(false);
    setRawImageSrc(null);

    toast.success(
      language === "hi"
        ? "छवि सफलतापूर्वक क्रॉप और संपीड़ित की गई!"
        : "Image cropped and auto-compressed!",
    );
  }, [zoom, language]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    let ageNum: number | null = null;
    if (age.trim()) {
      const parsed = parseInt(age, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 120) {
        toast.error(
          language === "hi"
            ? "कृपया 1 से 120 के बीच वैध आयु दर्ज करें"
            : "Please enter a valid age between 1 and 120",
        );
        return;
      }
      ageNum = parsed;
    }

    try {
      await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        age: ageNum,
        location: location.trim(),
        avatar_url: avatarUrl.trim(),
      });

      toast.success(
        language === "hi"
          ? "प्रोफ़ाइल सफलतापूर्वक सहेजी गई!"
          : "Profile updated successfully!",
      );
    } catch (err: any) {
      toast.error(
        err?.message ||
          (language === "hi"
            ? "प्रोफ़ाइल अपडेट करने में विफल"
            : "Failed to update profile"),
      );
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error(
        language === "hi"
          ? "कृपया अपना वर्तमान पासवर्ड दर्ज करें"
          : "Please enter your current password",
      );
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error(
        language === "hi"
          ? "नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए"
          : "New password must be at least 6 characters long",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(
        language === "hi" ? "पासवर्ड मेल नहीं खाते" : "Passwords do not match",
      );
      return;
    }

    try {
      await updatePassword({ currentPassword, newPassword });
      toast.success(
        language === "hi"
          ? "पासवर्ड सफलतापूर्वक बदल दिया गया!"
          : "Password updated successfully!",
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsPasswordOpen(false);
    } catch (err: any) {
      toast.error(
        err?.message ||
          (language === "hi"
            ? "पासवर्ड बदलने में विफल"
            : "Failed to update password"),
      );
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto p-4 space-y-4">
        <Skeleton className="h-32 w-full rounded-md" />
        <Skeleton className="h-80 w-full rounded-md" />
      </div>
    );
  }

  const displayName =
    `${firstName} ${lastName}`.trim() || user?.email?.split("@")[0] || "Farmer";
  const userInitials =
    `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() ||
    displayName?.[0]?.toUpperCase() ||
    "F";

  const createdDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(
        language === "hi" ? "hi-IN" : "en-US",
        { year: "numeric", month: "short", day: "numeric" },
      )
    : "N/A";

  return (
    <div className="w-full max-w-3xl mx-auto p-3 sm:p-4 space-y-4 animate-in fade-in duration-200">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 1. COMPACT HERO PROFILE BAR (rounded-md styling) */}
      <div className="relative overflow-hidden rounded-md border border-border bg-card p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Avatar Preview + Compact Camera Icon */}
          <div className="relative shrink-0">
            <Avatar
              size="lg"
              className="size-18 border border-emerald-500/40 shadow-xs"
            >
              {avatarUrl && (
                <AvatarImage
                  src={avatarUrl}
                  alt={displayName}
                  className="object-cover"
                />
              )}
              <AvatarFallback className="text-xl font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                {userInitials}
              </AvatarFallback>
            </Avatar>

            {/* Small camera trigger icon */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 size-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center justify-center transition-all hover:scale-105 cursor-pointer border border-background"
              title="Upload & crop avatar"
            >
              <Camera className="size-3" />
            </button>
          </div>

          {/* User Details Header */}
          <div className="flex flex-col text-center sm:text-left space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold tracking-tight text-foreground truncate">
                {displayName}
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="size-3" />
                Verified
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-muted-foreground">
              {phone && (
                <span className="flex items-center gap-1">
                  <Phone className="size-3 text-emerald-500 shrink-0" />
                  {phone}
                </span>
              )}
              {location && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3 text-emerald-500 shrink-0" />
                  {location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="size-3 text-emerald-500 shrink-0" />
                Joined {createdDate}
              </span>
            </div>
          </div>

          {/* Change Password Trigger Button */}
          <div className="shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPasswordOpen(true)}
              className="h-8 text-xs rounded-md flex items-center gap-1.5 border-border hover:bg-muted cursor-pointer font-medium"
            >
              <KeyRound className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                {language === "hi" ? "पासवर्ड बदलें" : "Change Password"}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. PROFILE EDIT FORM (rounded-md styling) */}
      <form
        onSubmit={handleSave}
        className="space-y-4 bg-card border border-border rounded-md p-4 sm:p-5 shadow-xs"
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <User className="size-4 text-emerald-500" />
            <h3 className="font-bold text-sm text-foreground">
              {language === "hi" ? "व्यक्तिगत जानकारी" : "Personal Information"}
            </h3>
          </div>

          {/* Image Upload Action with clear button */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 text-xs px-2.5 rounded-md flex items-center gap-1.5 border-border hover:bg-muted cursor-pointer"
            >
              <Upload className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{avatarUrl ? "Change Photo" : "Upload Photo"}</span>
            </Button>

            {avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setAvatarUrl("")}
                className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-md cursor-pointer shrink-0"
                title="Remove photo"
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Input Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {/* First Name */}
          <div className="space-y-1">
            <Label htmlFor="firstName" className="text-xs font-semibold">
              {language === "hi" ? "पहला नाम" : "First Name"}
            </Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Ramesh"
              className="bg-background h-8.5 text-xs rounded-md"
            />
          </div>

          {/* Last Name */}
          <div className="space-y-1">
            <Label htmlFor="lastName" className="text-xs font-semibold">
              {language === "hi" ? "अंतिम नाम" : "Last Name"}
            </Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Patel"
              className="bg-background h-8.5 text-xs rounded-md"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <Label
              htmlFor="phone"
              className="text-xs font-semibold flex items-center gap-1.5"
            >
              <Phone className="size-3 text-muted-foreground" />
              {language === "hi" ? "फ़ोन नंबर" : "Phone Number"}
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              className="bg-background h-8.5 text-xs rounded-md"
            />
          </div>

          {/* Age */}
          <div className="space-y-1">
            <Label htmlFor="age" className="text-xs font-semibold">
              {language === "hi" ? "आयु (वर्ष)" : "Age (Years)"}
            </Label>
            <Input
              id="age"
              type="number"
              min={1}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 42"
              className="bg-background h-8.5 text-xs rounded-md"
            />
          </div>

          {/* Location / Village */}
          <div className="sm:col-span-2 space-y-1">
            <Label
              htmlFor="location"
              className="text-xs font-semibold flex items-center gap-1.5"
            >
              <MapPin className="size-3 text-muted-foreground" />
              {language === "hi" ? "स्थान / जिला" : "Location / District"}
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Dholka, Ahmedabad, Gujarat"
              className="bg-background h-8.5 text-xs rounded-md"
            />
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="pt-3 flex justify-end border-t border-border mt-2">
          <Button
            type="submit"
            disabled={isUpdating}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8.5 px-5 rounded-md shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            {isUpdating ? (
              <>
                <LoaderCircle className="size-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="size-3.5" />
                <span>
                  {language === "hi" ? "परिवर्तन सहेजें" : "Save Changes"}
                </span>
              </>
            )}
          </Button>
        </div>
      </form>

      {/* 3. CHANGE PASSWORD DIALOG MODAL */}
      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="sm:max-w-md border border-border p-4 rounded-md gap-3">
          <DialogHeader className="pb-2 border-b border-border">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Lock className="size-4 text-emerald-500" />
              {language === "hi"
                ? "खाता पासवर्ड बदलें"
                : "Change Account Password"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handlePasswordSubmit} className="space-y-3 py-1">
            {/* Current Password Field */}
            <div className="space-y-1">
              <Label
                htmlFor="currentPassword"
                className="text-xs font-semibold"
              >
                {language === "hi" ? "वर्तमान पासवर्ड" : "Current Password"}
              </Label>
              <Input
                id="currentPassword"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-background h-8.5 text-xs rounded-md"
              />
            </div>

            {/* New Password Field */}
            <div className="space-y-1">
              <Label htmlFor="newPassword" className="text-xs font-semibold">
                {language === "hi" ? "नया पासवर्ड" : "New Password"}
              </Label>
              <Input
                id="newPassword"
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-background h-8.5 text-xs rounded-md"
              />
            </div>

            {/* Confirm New Password Field */}
            <div className="space-y-1">
              <Label
                htmlFor="confirmPassword"
                className="text-xs font-semibold"
              >
                {language === "hi"
                  ? "नए पासवर्ड की पुष्टि करें"
                  : "Confirm New Password"}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-background h-8.5 text-xs rounded-md"
              />
            </div>

            <DialogFooter className="border-t border-border pt-3 flex justify-between gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPasswordOpen(false)}
                className="text-xs h-8 rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isUpdatingPassword}
                className="text-xs h-8 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
              >
                {isUpdatingPassword ? (
                  <>
                    <LoaderCircle className="size-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. IMAGE CROP & RESIZE & AUTO-COMPRESS DIALOG */}
      <Dialog open={isCropOpen} onOpenChange={setIsCropOpen}>
        <DialogContent className="sm:max-w-md border border-border p-4 rounded-md gap-3">
          <DialogHeader className="pb-2 border-b border-border">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Crop className="size-4 text-emerald-500" />
              Crop & Compress Image
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-3 py-2">
            {/* Square Viewport */}
            <div className="relative size-60 rounded-md overflow-hidden bg-black/90 flex items-center justify-center border border-border">
              {rawImageSrc && (
                <img
                  ref={cropImgRef}
                  src={rawImageSrc}
                  alt="Crop Target"
                  style={{
                    transform: `scale(${zoom})`,
                    transition: "transform 0.1s ease-out",
                  }}
                  className="max-h-full max-w-full object-contain pointer-events-none"
                />
              )}
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-3 w-full max-w-xs px-2">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <ZoomOut className="size-4" />
              </button>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <ZoomIn className="size-4" />
              </button>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Auto-compresses to 300x300 JPEG (~30KB) for instant loading
            </span>
          </div>

          <DialogFooter className="border-t border-border pt-3 flex justify-between gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCropOpen(false)}
              className="text-xs h-8 rounded-md"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApplyCropAndCompress}
              className="text-xs h-8 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              Crop & Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
