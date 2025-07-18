import { useAppStore } from "@/shared/store/app-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { useNavigate } from "react-router";

const Dashboard = () => {
  const { pb, collections } = useAppStore();
  const navigate = useNavigate();

  const handleCollectionClick = (collectionName: string) => {
    navigate(`/c/${collectionName}`);
  };

  if (!pb) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="border-gray-900 border-b-2 rounded-full w-8 h-8 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-bold text-3xl tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your PocketBase collections.
        </p>
      </div>

      <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => (
          <Card
            key={collection.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleCollectionClick(collection.name)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="font-mono text-lg">
                  {collection.name}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {collection.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                {collection.fields?.length || 0} fields
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {collections.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No collections found.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
