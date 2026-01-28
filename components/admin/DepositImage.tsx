import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Image, ExternalLink } from 'lucide-react';

export const DepositImage = ({ path }: { path: string | null }) => {
    const [url, setUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!path) {
            setLoading(false);
            return;
        }

        let active = true;
        const fetchUrl = async () => {
            try {
                setLoading(true);
                let cleanPath = path;

                if (path.startsWith('http')) {
                    if (active) {
                        setUrl(path);
                        setLoading(false);
                    }
                    return;
                }

                if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);

                const { data, error: signedError } = await supabase.storage
                    .from('deposit_proofs')
                    .createSignedUrl(cleanPath, 60);

                if (signedError) throw signedError;

                if (active && data?.signedUrl) {
                    setUrl(data.signedUrl);
                }
            } catch (err) {
                console.error("Error loading image:", err);
                if (active) setError(true);
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchUrl();
        return () => { active = false; };
    }, [path]);

    if (!path) return <span className="text-gray-600 text-[10px]">-</span>;
    if (loading) return <Loader2 className="w-4 h-4 animate-spin text-gray-500" />;
    
    if (error || !url) {
        return (
            <div className="w-10 h-10 bg-[#222] rounded-lg border border-[#333] flex items-center justify-center" title="فشل تحميل الصورة">
                <Image className="w-4 h-4 text-gray-600" />
            </div>
        );
    }

    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block w-10 h-10 relative group">
            <img 
                src={url} 
                className="w-full h-full object-cover rounded-lg border border-white/10 group-hover:border-primary transition-colors bg-[#222]" 
                alt="Proof" 
                onError={() => setError(true)}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                <ExternalLink className="w-3 h-3 text-white" />
            </div>
        </a>
    );
};
