import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Bill } from './types';

function formatDuration(seconds: number) {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00:00';
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map(v => (v < 10 ? '0' + v : v)).join(':');
}

export const generateBillPdf = (bill: Bill, tableName: string) => {
  const doc = new jsPDF();

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('THE OX SNOOKER', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Tax Invoice/Bill of Supply', 105, 28, { align: 'center' });

  // Line separator
  doc.setDrawColor(180, 180, 180);
  doc.line(15, 32, 195, 32);

  // Bill and Table Details
  autoTable(doc, {
    startY: 35,
    body: [
      ['Bill Number:', bill.id],
      ['Table Name:', tableName],
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1 },
    columnStyles: { 0: { fontStyle: 'bold' } },
  });

  // Session Details
  autoTable(doc, {
    head: [['Session & Payment Details']],
    body: [
      ['Date', format(new Date(bill.billDate), 'dd MMM yyyy')],
      ['Start Time', format(new Date(bill.startTime), 'hh:mm:ss a')],
      ['End Time', format(new Date(bill.endTime), 'hh:mm:ss a')],
      ['Total Duration', formatDuration(bill.duration)],
      ['Payment Method', bill.paymentMethod.toUpperCase()],
    ],
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    columnStyles: { 0: { fontStyle: 'bold' } },
    didDrawPage: (data) => {
        // To prevent table from splitting across pages if it's short
        data.settings.margin.top = 10;
    }
  });

  // Items Purchased
  if (bill.sessionItems.length > 0) {
    autoTable(doc, {
      head: [['Item', 'Qty', 'Price', 'Total']],
      body: bill.sessionItems.map(item => [
        item.product.name,
        item.quantity,
        `₹${item.product.price.toFixed(2)}`,
        `₹${(item.product.price * item.quantity).toFixed(2)}`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    });
  }

  // Final Costs
  const finalY = (doc as any).lastAutoTable.finalY || 100;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');

  const costDetails = [
    { label: 'Table Time Cost:', value: `₹${bill.tableBill.toFixed(2)}` },
    { label: 'Products Cost:', value: `₹${bill.itemsBill.toFixed(2)}` },
    { label: 'Grand Total:', value: `₹${bill.totalAmount.toFixed(2)}` },
  ];
  
  let yPos = finalY + 10;

  costDetails.forEach(detail => {
      if (detail.label === 'Grand Total:') {
          doc.setFontSize(14);
          yPos += 2; // Add a little space before the grand total
      } else {
          doc.setFontSize(11);
      }
      doc.text(detail.label, 130, yPos);
      doc.text(detail.value, 195, yPos, { align: 'right' });
      yPos += 7;
  });


  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for playing at The Ox Snooker!', 105, pageHeight - 10, { align: 'center' });

  // Auto-download
  doc.save(`Bill-${tableName}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
