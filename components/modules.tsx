"use client";

// components/sub-module-cards.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image"; 
import { useRouter } from "next/navigation";

interface ModuleItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  image: string;
  link: string;
}

interface ModulesProps {
  modules: ModuleItem[];
}

/**
 * Componente de tarjetas de módulos reutilizable.
 *
 * @example
 * import { Modules } from "@/components/modules";
 * import { Calendar, MessageSquare, Bell } from "lucide-react";
 *
 * const modules = [
 *   {
 *     title: "Programación",
 *     description: "Gestión de cronogramas",
 *     icon: <Calendar className="h-6 w-6 text-muted-foreground" />,
 *     image: "/img/programacion.jpg",
 *     link: "/programacion",
 *   },
 *   // ...otros módulos
 * ];
 *
 * <Modules modules={modules} />
 */
export function Modules({ modules = [] }: ModulesProps) {
  const router = useRouter();

  const handleModuleClick = (moduleItem: ModuleItem) => {
    router.push(moduleItem.link);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-[1920px] mx-auto">
      {modules.map((moduleItem) => (
        <div
          key={moduleItem.title}
          onClick={() => handleModuleClick(moduleItem)}
          className="cursor-pointer"
        >
          <Card className="h-[320px] flex flex-col hover:shadow-lg transition-shadow duration-300 border-2 border-solid border-[#4A6FA5]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium truncate max-w-[80%]">{moduleItem.title}</CardTitle>
              {moduleItem.icon}
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="relative h-[160px] mb-4">
                <Image
                  src={moduleItem.image.trim()}
                  alt={moduleItem.title}
                  fill
                  className="rounded-md object-cover"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-auto line-clamp-2 pb-4">{moduleItem.description}</p>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}