import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 selection:bg-black selection:text-white">
            <div className="text-center space-y-6 max-w-md">
                <h1 className="text-9xl font-black text-black tracking-tighter">404</h1>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight text-black uppercase">Page not found</h2>
                    <p className="text-zinc-500 font-sans text-sm">
                        The resource you are looking for does not exist, has been removed, or is temporarily unavailable.
                    </p>
                </div>
                
                <div className="pt-4">
                    <Link 
                        href="/" 
                        className="inline-block bg-black text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-zinc-800 transition-colors shadow-lg hover:shadow-xl"
                    >
                        Return Home
                    </Link>
                </div>
            </div>
            
            <div className="absolute bottom-8 text-[10px] uppercase tracking-widest font-bold text-zinc-400">
                SYSTEM_ERROR // RESOURCE_LOCATOR_FAILURE
            </div>
        </div>
    );
}
