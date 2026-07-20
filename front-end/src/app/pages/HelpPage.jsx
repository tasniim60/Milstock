import { PageHeader } from "../components/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { HelpCircle, Book, MessageCircle, Mail } from "lucide-react";
import { Button } from "../components/Button";
const faqs = [
  {
    question: "How do I submit a supply request?",
    answer: 'Navigate to the Requests section and click "Create Request". Fill in the required details including item name, quantity, and delivery date, then submit for approval.'
  },
  {
    question: "What happens when items are low in stock?",
    answer: "The system automatically generates alerts when items fall below predefined thresholds. Admin users receive notifications and can take action to restock."
  },
  {
    question: "How can I track my request status?",
    answer: 'Go to "My Requests" in your dashboard to view all requests and their current status (Pending, Approved, Delivered).'
  },
  {
    question: "Who can approve supply requests?",
    answer: "Only Admin users and Warehouse Supervisors have permission to approve or reject supply requests."
  }
];
const HelpPage = () => {
  return <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
    title="Help & Support"
    subtitle="Find answers and get assistance"
  />

      <div className="max-w-4xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex flex-col items-center text-center p-6">
              <div className="p-4 bg-primary bg-opacity-10 rounded-xl mb-4">
                <Book className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">User Guide</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive documentation for all features
              </p>
            </div>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex flex-col items-center text-center p-6">
              <div className="p-4 bg-primary bg-opacity-10 rounded-xl mb-4">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Live Chat</h3>
              <p className="text-sm text-muted-foreground">
                Chat with our support team in real-time
              </p>
            </div>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex flex-col items-center text-center p-6">
              <div className="p-4 bg-primary bg-opacity-10 rounded-xl mb-4">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Contact Support</h3>
              <p className="text-sm text-muted-foreground">
                Email us at support@milstock.local
              </p>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <HelpCircle className="w-6 h-6 text-primary" />
              <CardTitle>Frequently Asked Questions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {faqs.map((faq, index) => <div key={index} className="pb-6 border-b border-border last:border-0 last:pb-0">
                  <h4 className="font-semibold text-foreground mb-2">{faq.question}</h4>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#4B5B3A] to-[#6A7B4D] text-white">
          <div className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-3">Need More Help?</h3>
            <p className="mb-6 opacity-90">
              Our support team is available 24/7 to assist you with any questions or issues.
            </p>
            <Button variant="secondary" size="lg">
              Contact Support Team
            </Button>
          </div>
        </Card>
      </div>
    </div>;
};
export {
  HelpPage
};
