import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface ProductCardProps {
  name: string;
  description: string;
  price: number;
  features?: string[];
  category?: string;
}

export const ProductCard = ({ name, description, price, features, category }: ProductCardProps) => {
  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
      <CardHeader>
        {category && (
          <Badge className="w-fit mb-2 bg-primary/20 text-primary border-primary/30">
            {category}
          </Badge>
        )}
        <CardTitle className="text-foreground">{name}</CardTitle>
        <CardDescription className="text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-primary">${price.toLocaleString()}</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        
        {features && features.length > 0 && (
          <div className="space-y-2">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        )}
        
        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          Learn More
        </Button>
      </CardContent>
    </Card>
  );
};