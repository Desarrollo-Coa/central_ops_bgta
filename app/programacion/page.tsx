// app/programacion/page.tsx
import  MainSidebar  from "@/components/main-sidebar";
import { RouteList } from "@/components/route-list";

export default function Programacion() {
  const sections = [ 
    { title: "CUMPLIDO DEL PERSONAL", link: "/programacion/cumplido" }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <MainSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <h1 className="text-3xl font-semibold mb-6 text-gray-800">Programación</h1>
          <p className="mb-6 text-gray-600">Gestiona y observa el cumplimiento del personal en los distintos servicios.</p>
          <RouteList routes={sections} />
        </main>
      </div>
    </div>
  );
}