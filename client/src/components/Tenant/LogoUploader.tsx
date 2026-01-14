"use client";

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface LogoUploaderProps {
    currentLogo?: string | null;
    onUpload: (file: File) => Promise<string>;
    onRemove?: () => void;
}

export default function LogoUploader({ currentLogo, onUpload, onRemove }: LogoUploaderProps) {
    const [preview, setPreview] = useState<string | null>(currentLogo || null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            alert('Lütfen bir resim dosyası seçin!');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Dosya boyutu 5MB\'dan küçük olmalı!');
            return;
        }

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload
        setUploading(true);
        try {
            await onUpload(file);
        } catch (error: any) {
            alert('Yükleme hatası: ' + error.message);
            setPreview(currentLogo || null);
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onRemove?.();
    };

    return (
        <div className="space-y-3">
            <label className="text-sm font-bold text-secondary uppercase tracking-wider">
                Firma Logosu
            </label>

            <div className="flex items-start gap-4">
                {/* Preview */}
                <div className="relative w-32 h-32 bg-white/5 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center overflow-hidden group">
                    {preview ? (
                        <>
                            <Image
                                src={preview}
                                alt="Logo preview"
                                fill
                                className="object-cover"
                            />
                            {!uploading && (
                                <button
                                    onClick={handleRemove}
                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                >
                                    <X className="w-8 h-8 text-white" />
                                </button>
                            )}
                        </>
                    ) : (
                        <ImageIcon className="w-12 h-12 text-white/20" />
                    )}

                    {uploading && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </div>

                {/* Upload Button */}
                <div className="flex-1">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="logo-upload"
                    />

                    <label
                        htmlFor="logo-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl cursor-pointer transition-all font-bold"
                    >
                        <Upload className="w-4 h-4" />
                        {preview ? 'Logoyu Değiştir' : 'Logo Yükle'}
                    </label>

                    <p className="text-xs text-secondary mt-2">
                        PNG, JPG veya WEBP. Maksimum 5MB.
                    </p>
                </div>
            </div>
        </div>
    );
}
