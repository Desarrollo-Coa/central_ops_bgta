import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface ModuleCard {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color?: string;
}

interface ModuleCardsProps {
  modules: ModuleCard[];
}

export function ModuleCards({ modules }: ModuleCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {modules.map((module, index) => {
        const Icon = module.icon;
        return (
          <Link href={module.href} key={index} className="group">
            <Card className="cursor-pointer border hover:shadow-md transition-all h-full bg-white min-h-[140px] flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center gap-4 pb-2 pt-4 px-4 flex-1">
                <div className={`flex items-center justify-center rounded-full h-10 w-10 bg-gray-100 ${module.color || "text-blue-500"}`}>
                  <Icon className={`h-5 w-5 ${module.color || "text-blue-500"}`} />
                </div>
                <div className="flex flex-col flex-1">
                  <CardTitle className="text-base font-semibold text-gray-900 text-left">
                    {module.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600 text-left leading-snug mt-1">
                    {module.description}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="hidden" />
            </Card>
          </Link>
        );
      })}
    </div>
  );
}