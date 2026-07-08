import Link from 'next/link'; 
import { ModeToggle } from './dashboard/sidebar/thememode';

interface Propstype {
    cssClassNames?: string;
}
export default function HeaderTopBar({ cssClassNames }: Propstype) {
    return (
        <>
            <div className={`bg-foreground py-1 hidden md:block ${cssClassNames}`}>
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center gap-5">
                        <div className="flex items-center gap-5">
                            <div className="flex items-center space-x-2">
                                <ModeToggle />
                            </div> 
                        </div>
                        <div className="flex items-center gap-5">
                            <Link href="/sign-up" className="text-white text-xs">Sign Up</Link>
                            <Link href="/about-us" className="text-white text-xs">About</Link>
                            <Link href="/partners" className="text-white text-xs">Partners</Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
