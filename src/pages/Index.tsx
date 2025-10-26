import { useState, useEffect } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { ProductCard } from "@/components/ProductCard";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { LeadScoring } from "@/components/LeadScoring";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  features?: string[];
  category?: string;
}

const Index = () => {
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(5);

    if (!error && data) {
      setAllProducts(data);
      setRecommendedProducts(data.slice(0, 3));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-card via-background to-secondary border-b border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Intelligent AI Sales Assistant
            </h1>
            <p className="text-xl text-muted-foreground">
              Transforming conversations into conversions with intelligent automation
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="chat" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="chat" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Chat
            </TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Products
            </TabsTrigger>
            <TabsTrigger value="leads" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Lead Scoring
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Chat Interface */}
              <div className="lg:col-span-2 h-[600px]">
                <ChatInterface onProductsRecommended={setRecommendedProducts} />
              </div>

              {/* Recommended Products */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Recommended for You</h3>
                <div className="space-y-4">
                  {recommendedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      name={product.name}
                      description={product.description}
                      price={product.price}
                      features={product.features}
                      category={product.category}
                    />
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  name={product.name}
                  description={product.description}
                  price={product.price}
                  features={product.features}
                  category={product.category}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="leads">
            <LeadScoring />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;