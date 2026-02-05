import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function StaticMealList() {
  const meals = [
    { day: "শনিবার", lunch: "মাছ", dinner: "ভর্তা" },
    { day: "রবিবার", lunch: "ডিম", dinner: "মুরগি" },
    { day: "সোমবার", lunch: "মাছ", dinner: "সবজি" },
    { day: "মঙ্গলবার", lunch: "ডিম", dinner: "মুরগি" },
    { day: "বুধবার", lunch: "মাছ", dinner: "সবজি" },
    { day: "বৃহস্পতিবার", lunch: "ভর্তা", dinner: "বিরিয়ানি" },
    { day: "শুক্রবার", lunch: "মুরগি", dinner: "ডিম" },
  ]

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-primary/5 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="text-xl">🍽️</span> খাবারের তালিকা
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[100px] font-bold text-primary">বার</TableHead>
              <TableHead className="font-bold text-primary">দুপুর</TableHead>
              <TableHead className="font-bold text-primary">রাত</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meals.map((meal) => (
              <TableRow key={meal.day} className="hover:bg-muted/30 even:bg-muted/10">
                <TableCell className="font-medium">{meal.day}</TableCell>
                <TableCell>{meal.lunch}</TableCell>
                <TableCell>{meal.dinner}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
