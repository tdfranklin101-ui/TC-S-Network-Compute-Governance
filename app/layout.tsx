import TCSFooter from "@/components/tcs/TCSFooter";
import TCSTopNav from "@/components/tcs/TCSTopNav";
import TCSSolarBackground from "@/components/tcs/TCSSolarBackground";
export const metadata = {
  title: "TC-S Application",
  description: "Part of the TC-S Network Constellation"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
      <TCSSolarBackground>
        <div className="min-h-screen flex flex-col">
          <TCSTopNav />
          <div className="flex-1">

      <TCSSolarBackground>
        <div className="min-h-screen flex flex-col">
          <TCSTopNav />
          <div className="flex-1">
{children}
          </div>
          <TCSFooter />
        </div>
      </TCSSolarBackground>
    
          </div>
          <TCSFooter />
        </div>
      </TCSSolarBackground>
    </body>
    </html>
  );
}
