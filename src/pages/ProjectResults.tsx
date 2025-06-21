
import { AppNavbar } from "@/components/AppNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useParams } from "react-router-dom";

const ProjectResults = () => {
  const { id } = useParams();

  const rawCounts = [
    { item: "2x4x8 Stud", qty: 145, unit: "ea" },
    { item: "2x4x10 Stud", qty: 32, unit: "ea" },
    { item: "2x6x8 Plate", qty: 28, unit: "ea" },
    { item: "2x10x12 Header", qty: 12, unit: "ea" },
    { item: "7/16 OSB Sheathing", qty: 24, unit: "sheets" },
  ];

  const pricedList = [
    { item: "2x4x8 SPF Stud", qty: 145, unit: "ea", unitPrice: 3.47, total: 503.15 },
    { item: "2x4x10 SPF Stud", qty: 32, unit: "ea", unitPrice: 4.23, total: 135.36 },
    { item: "2x6x8 SPF Plate", qty: 28, unit: "ea", unitPrice: 8.95, total: 250.60 },
    { item: "2x10x12 Glulam Header", qty: 12, unit: "ea", unitPrice: 89.50, total: 1074.00 },
    { item: "7/16 OSB Sheathing 4x8", qty: 24, unit: "sheets", unitPrice: 22.45, total: 538.80 },
  ];

  const totalEstimate = pricedList.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Lumber List & Pricing</h1>
          <p className="text-muted-foreground">
            Complete material list with pricing ready for export
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="rounded-2xl shadow-lg">
            <CardHeader>
              <CardTitle>Raw Counts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rawCounts.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.item}</TableCell>
                      <TableCell>{item.qty}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-lg">
            <CardHeader>
              <CardTitle>Priced List</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricedList.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.item}</TableCell>
                      <TableCell>{item.qty}</TableCell>
                      <TableCell>${item.unitPrice}</TableCell>
                      <TableCell className="font-semibold">${item.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Estimate:</span>
                  <span className="text-secondary">${totalEstimate.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle>Export Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="rounded-full" variant="outline">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export to Excel
              </Button>
              <Button className="rounded-full" variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Export to CSV
              </Button>
              <Button className="rounded-full" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export to PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectResults;
