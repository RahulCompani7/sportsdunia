import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, useMemo } from "react";

interface PayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: NewsArticle[];
  onSave: (updatedPayouts: any[]) => void;
}

interface NewsArticle {
  title: string;
  description: string;
  link: string;
  image_url?: string;
  source_id: string;
  category: string[];
  pubDate: string;
  creator?: string[];
  payout?: number;
}

const PayoutModal: React.FC<PayoutModalProps> = ({
  isOpen,
  onClose,
  articles,
  onSave,
}) => {
  const [payouts, setPayouts] = useState(
  articles.map((article) => ({
    ...article,
    payout: article.payout ?? 0,
  }))
);


  const handlePayoutChange = (index: number, value: number) => {
    const updated = [...payouts];
    updated[index].payout = value;
    setPayouts(updated);
  };

  const handleSave = () => {
    onSave(payouts);
    onClose();
  };

  const payoutSummary = useMemo(() => {
    const summary: Record<string, { articles: string[]; total: number }> = {};

    payouts.forEach(({ creator, title, payout }) => {
      (creator ?? ["Unknown"]).forEach((author) => {
        if (!summary[author]) summary[author] = { articles: [], total: 0 };
        summary[author].articles.push(title);
        summary[author].total += payout || 0;
      });
    });

    return summary;
  }, [payouts]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-[150vh] max-h-[80vh] overflow-y-auto overflow-x-auto bg-background text-foreground rounded-2xl shadow-xl p-6">
        <DialogHeader>
          <DialogTitle>Set Payouts</DialogTitle>
          <DialogDescription>
            Enter the payout values for each filtered article.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {articles.map((article, index) => (
            <div
              key={article.link}
              className="border rounded-lg p-4 bg-muted"
            >
              <h4 className="text-base font-medium">{article.title}</h4>
              <p className="text-sm text-muted-foreground">
                {article.creator?.join(", ") || "Unknown Author"}
              </p>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  value={
                    isNaN(payouts[index]?.payout)
                      ? ""
                      : payouts[index].payout
                  }
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val >= 0) {
                      handlePayoutChange(index, val);
                    } else if (e.target.value === "") {
                      handlePayoutChange(index, NaN);
                    }
                  }}
                  placeholder="Enter payout"
                  className="pl-7 w-full rounded-md border border-input bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Summary Table */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Payout Summary</h3>
          <Table>
  <TableHeader>
    <TableRow>
      <TableHead className="w-[150px]">Author</TableHead>
      <TableHead className="w-[400px]">Articles</TableHead>
      <TableHead className="w-[150px] text-right">Total Payout (₹)</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {Object.entries(payoutSummary).map(([author, { articles, total }]) => (
      <TableRow key={author}>
        <TableCell className="font-medium truncate">{author}</TableCell>
        <TableCell className="text-sm max-w-[400px] truncate overflow-hidden">
          {articles.join(", ")}
        </TableCell>
        <TableCell className="text-right font-medium">
          ₹ {total.toFixed(2)}
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

        </div>

        <DialogFooter className="mt-6">
          <Button onClick={handleSave}>Save</Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PayoutModal;
