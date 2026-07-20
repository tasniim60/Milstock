import { useState } from "react";
import { PageHeaderAr } from "../../components/ar/PageHeaderAr";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/Card";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { Search, ChevronDown, ChevronUp, Mail, Phone, MessageCircle, Book, Video } from "lucide-react";
const faqs = [
  {
    id: "1",
    category: "\u0627\u0644\u0645\u062E\u0632\u0648\u0646",
    question: "\u0643\u064A\u0641 \u0623\u0636\u064A\u0641 \u0635\u0646\u0641\u0627\u064B \u062C\u062F\u064A\u062F\u0627\u064B \u0625\u0644\u0649 \u0627\u0644\u0645\u062E\u0632\u0648\u0646\u061F",
    answer: '\u0627\u0646\u062A\u0642\u0644 \u0625\u0644\u0649 \u0642\u0633\u0645 "\u0627\u0644\u0645\u062E\u0632\u0648\u0646" \u0645\u0646 \u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062C\u0627\u0646\u0628\u064A\u0629\u060C \u062B\u0645 \u0627\u0646\u0642\u0631 \u0639\u0644\u0649 \u0632\u0631 "\u0625\u0636\u0627\u0641\u0629 \u0635\u0646\u0641 \u062C\u062F\u064A\u062F" \u0641\u064A \u0623\u0639\u0644\u0649 \u0627\u0644\u0635\u0641\u062D\u0629. \u0639\u0628\u0651\u0626 \u0627\u0644\u0646\u0645\u0648\u0630\u062C \u0628\u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629 \u0648\u0627\u0646\u0642\u0631 \u0639\u0644\u0649 "\u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0635\u0646\u0641".'
  },
  {
    id: "2",
    category: "\u0627\u0644\u0637\u0644\u0628\u0627\u062A",
    question: "\u0645\u0627 \u0647\u064A \u062E\u0637\u0648\u0627\u062A \u0625\u0646\u0634\u0627\u0621 \u0637\u0644\u0628 \u062A\u0648\u0631\u064A\u062F\u061F",
    answer: '\u0627\u0646\u062A\u0642\u0644 \u0625\u0644\u0649 "\u0625\u0646\u0634\u0627\u0621 \u0637\u0644\u0628" \u0645\u0646 \u0627\u0644\u0642\u0627\u0626\u0645\u0629\u060C \u0627\u062E\u062A\u0631 \u0623\u0648\u0644\u0648\u064A\u0629 \u0627\u0644\u0637\u0644\u0628 \u0648\u0648\u062D\u062F\u062A\u0643\u060C \u0623\u0636\u0641 \u0627\u0644\u0623\u0635\u0646\u0627\u0641 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629 \u0645\u0639 \u0627\u0644\u0643\u0645\u064A\u0627\u062A\u060C \u0627\u0643\u062A\u0628 \u0645\u0628\u0631\u0631 \u0627\u0644\u0637\u0644\u0628\u060C \u062B\u0645 \u0627\u0646\u0642\u0631 "\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628". \u0633\u064A\u0635\u0644 \u0627\u0644\u0637\u0644\u0628 \u0644\u0644\u0645\u0633\u0624\u0648\u0644 \u0641\u0648\u0631\u0627\u064B.'
  },
  {
    id: "3",
    category: "\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A",
    question: "\u0645\u062A\u0649 \u064A\u064F\u0631\u0633\u064E\u0644 \u062A\u0646\u0628\u064A\u0647 \u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u0645\u0646\u062E\u0641\u0636\u061F",
    answer: '\u064A\u064F\u0631\u0633\u064E\u0644 \u0627\u0644\u062A\u0646\u0628\u064A\u0647 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B \u0639\u0646\u062F\u0645\u0627 \u062A\u0635\u0644 \u0643\u0645\u064A\u0629 \u0623\u064A \u0635\u0646\u0641 \u0625\u0644\u0649 \u0645\u0627 \u062F\u0648\u0646 \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u062F\u0646\u0649 \u0627\u0644\u0645\u062D\u062F\u062F \u0641\u064A \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645. \u064A\u0645\u0643\u0646\u0643 \u062A\u0639\u062F\u064A\u0644 \u0647\u0630\u0627 \u0627\u0644\u062D\u062F \u0645\u0646 \u0635\u0641\u062D\u0629 "\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645".'
  },
  {
    id: "4",
    category: "\u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0627\u062A",
    question: "\u0645\u0627 \u0627\u0644\u0641\u0631\u0642 \u0628\u064A\u0646 \u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0648\u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0648\u062D\u062F\u0629\u061F",
    answer: "\u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u064A\u0645\u0644\u0643 \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0643\u0627\u0645\u0644\u0629: \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062E\u0632\u0648\u0646\u060C \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0639\u0644\u0649 \u0627\u0644\u0637\u0644\u0628\u0627\u062A\u060C \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646\u060C \u0648\u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631 \u0627\u0644\u0634\u0627\u0645\u0644\u0629. \u0623\u0645\u0627 \u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0648\u062D\u062F\u0629 \u0641\u064A\u0642\u062A\u0635\u0631 \u062F\u0648\u0631\u0647 \u0639\u0644\u0649 \u0627\u0633\u062A\u0639\u0631\u0627\u0636 \u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u0645\u062A\u0627\u062D \u0648\u0625\u0646\u0634\u0627\u0621 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u062A\u0648\u0631\u064A\u062F \u0648\u0645\u062A\u0627\u0628\u0639\u062A\u0647\u0627."
  },
  {
    id: "5",
    category: "\u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631",
    question: "\u0643\u064A\u0641 \u0623\u0635\u062F\u0651\u0631 \u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u0645\u062E\u0632\u0648\u0646\u061F",
    answer: '\u0627\u0630\u0647\u0628 \u0625\u0644\u0649 \u0635\u0641\u062D\u0629 "\u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631 \u0648\u0627\u0644\u062A\u062D\u0644\u064A\u0644\u0627\u062A"\u060C \u0627\u062E\u062A\u0631 \u0646\u0648\u0639 \u0627\u0644\u062A\u0642\u0631\u064A\u0631 \u0648\u0627\u0644\u0641\u062A\u0631\u0629 \u0627\u0644\u0632\u0645\u0646\u064A\u0629\u060C \u062B\u0645 \u0627\u0646\u0642\u0631 \u0639\u0644\u0649 "\u062A\u0635\u062F\u064A\u0631 PDF" \u0623\u0648 "\u062A\u0635\u062F\u064A\u0631 Excel" \u062D\u0633\u0628 \u0627\u062D\u062A\u064A\u0627\u062C\u0643.'
  },
  {
    id: "6",
    category: "\u0627\u0644\u0623\u0645\u0627\u0646",
    question: "\u0645\u0627\u0630\u0627 \u0623\u0641\u0639\u0644 \u0625\u0630\u0627 \u0646\u0633\u064A\u062A \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631\u061F",
    answer: '\u0627\u0646\u0642\u0631 \u0639\u0644\u0649 \u0631\u0627\u0628\u0637 "\u0646\u0633\u064A\u062A \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631\u061F" \u0641\u064A \u0635\u0641\u062D\u0629 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644\u060C \u0623\u062F\u062E\u0644 \u0628\u0631\u064A\u062F\u0643 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0627\u0644\u0645\u0633\u062C\u0644\u060C \u0633\u062A\u062A\u0644\u0642\u0649 \u0631\u0633\u0627\u0644\u0629 \u062A\u0639\u0644\u064A\u0645\u0627\u062A \u0644\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631.'
  }
];
const guides = [
  { title: "\u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u0634\u0627\u0645\u0644", desc: "\u0634\u0631\u062D \u062A\u0641\u0635\u064A\u0644\u064A \u0644\u062C\u0645\u064A\u0639 \u0648\u0638\u0627\u0626\u0641 \u0644\u0648\u062D\u0629 \u062A\u062D\u0643\u0645 \u0627\u0644\u0645\u0633\u0624\u0648\u0644", icon: Book, color: "bg-[#4B5B3A]" },
  { title: "\u062F\u0644\u064A\u0644 \u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0648\u062D\u062F\u0629", desc: "\u0643\u064A\u0641\u064A\u0629 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0637\u0644\u0628\u0627\u062A \u0648\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u0645\u062E\u0632\u0648\u0646", icon: Book, color: "bg-[#6A7B4D]" },
  { title: "\u0641\u064A\u062F\u064A\u0648: \u062C\u0648\u0644\u0629 \u0641\u064A \u0627\u0644\u0646\u0638\u0627\u0645", desc: "\u0645\u0642\u062F\u0645\u0629 \u0645\u0631\u0626\u064A\u0629 \u0644\u0644\u0645\u0646\u0638\u0648\u0645\u0629 \u0648\u0623\u0647\u0645 \u0645\u0645\u064A\u0632\u0627\u062A\u0647\u0627", icon: Video, color: "bg-[#C9A961]" }
];
const HelpPageAr = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const categories = ["all", ...Array.from(new Set(faqs.map((f) => f.category)))];
  const filtered = faqs.filter((faq) => {
    const matchSearch = faq.question.includes(searchTerm) || faq.answer.includes(searchTerm);
    const matchCat = activeCategory === "all" || faq.category === activeCategory;
    return matchSearch && matchCat;
  });
  return <div className="p-6 lg:p-8 space-y-6">
      <PageHeaderAr
    title="الدعم والمساعدة"
    subtitle="إيجاد الإجابات وحل المشكلات بسرعة وسهولة"
  />

      {
    /* Search — right-aligned in RTL */
  }
      <div className="relative max-w-xl mb-8 ml-auto">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        <Input
    placeholder="ابحث في الأسئلة الشائعة..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="pr-12 text-right"
  />
      </div>

      {
    /* Quick guides */
  }
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {guides.map((guide) => {
    const Icon = guide.icon;
    return <button
      key={guide.title}
      className="p-5 bg-card border border-border rounded-2xl hover:shadow-md transition-shadow text-right group"
    >
              <div className={`${guide.color} text-white p-3 rounded-xl inline-block mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{guide.title}</h3>
              <p className="text-sm text-muted-foreground">{guide.desc}</p>
            </button>;
  })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {
    /* FAQs */
  }
        <div className="lg:col-span-2">
          <h2 className="text-right mb-4 text-foreground font-semibold text-lg">الأسئلة الشائعة</h2>

          <div className="flex flex-wrap gap-2 mb-5 justify-end">
            {categories.map((cat) => <button
    key={cat}
    onClick={() => setActiveCategory(cat)}
    className={`px-3 py-1.5 rounded-xl text-sm transition-colors ${activeCategory === cat ? "bg-[#4B5B3A] text-white" : "bg-card border border-border text-foreground hover:bg-muted"}`}
  >
                {cat === "all" ? "\u0627\u0644\u0643\u0644" : cat}
              </button>)}
          </div>

          <div className="space-y-3">
            {filtered.map((faq) => <div key={faq.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <button
    className="w-full p-5 flex items-center justify-between hover:bg-muted/20 transition-colors"
    onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
  >
                  <p className="font-medium text-foreground text-right flex-1 ml-3">{faq.question}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs px-2 py-0.5 bg-muted rounded-lg text-muted-foreground">{faq.category}</span>
                    {openFaq === faq.id ? <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
                  </div>
                </button>
                {openFaq === faq.id && <div className="px-5 pb-5 text-right">
                    <p className="text-muted-foreground text-sm leading-relaxed border-t border-border pt-4">{faq.answer}</p>
                  </div>}
              </div>)}
          </div>
        </div>

        {
    /* Contact */
  }
        <div className="space-y-4">
          <h2 className="text-right text-foreground font-semibold text-lg">تواصل مع الدعم</h2>

          {[
    { icon: Mail, label: "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A", value: "support@milstock.local", color: "bg-[#4B5B3A]" },
    { icon: Phone, label: "\u0627\u0644\u0647\u0627\u062A\u0641 \u0627\u0644\u0645\u0628\u0627\u0634\u0631", value: "+966 11 123 4567", color: "bg-[#6A7B4D]" },
    { icon: MessageCircle, label: "\u0627\u0644\u062F\u0631\u062F\u0634\u0629 \u0627\u0644\u0641\u0648\u0631\u064A\u0629", value: "\u0645\u062A\u0627\u062D 24/7 \u0644\u0644\u0637\u0648\u0627\u0631\u0626", color: "bg-[#C9A961]" }
  ].map((c) => <Card key={c.label} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 flex-row-reverse">
                  <div className={`${c.color} text-white p-3 rounded-xl`}>
                    <c.icon className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    <p className="font-medium text-foreground">{c.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>)}

          <Card>
            <CardHeader><CardTitle className="text-right">إرسال رسالة</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="الموضوع" className="text-right" />
              <textarea
    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-right resize-none"
    rows={4}
    placeholder="صف مشكلتك بالتفصيل..."
  />
              <Button className="w-full flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                إرسال الرسالة
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};
export {
  HelpPageAr
};
