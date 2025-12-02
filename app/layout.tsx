import TCSFooter from "@/components/tcs/TCSFooter";
import TCSTopNav from "@/components/tcs/TCSTopNav";
import TCSSolarBackground from "@/components/tcs/TCSSolarBackground";
import "./globals.css";

export const metadata = {
  title: "TC-S Compute Governance",
  description: "Part of the TC-S Network Constellation"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TCSSolarBackground>
          <div className="min-h-screen flex flex-col">
            <TCSTopNav />
            <div className="flex-1">
              {children}
            </div>
            <TCSFooter />
          </div>
        </TCSSolarBackground>
      </body>
    </html>
  );
}
