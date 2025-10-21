import Link from "next/link";

interface RouteItem {
  title: string;
  link: string;
}

interface RouteListProps {
  routes: RouteItem[];
}

export function RouteList({ routes }: RouteListProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {routes.map((route, index) => (
        <div key={route.link}>
          <Link href={route.link}>
            <div className="p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
              <h2 className="text-lg font-medium text-gray-900">{route.title}</h2>
            </div>
          </Link>
          {index < routes.length - 1 && <hr className="border-t border-gray-300 my-2 mx-4" />}
        </div>
      ))}
    </div>
  );
} 