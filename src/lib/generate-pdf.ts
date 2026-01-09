// @ts-nocheck
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import type { Bill } from './types';

const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

export function generateBillPdf(bill: Omit<Bill, 'id'>, tableName: string, elapsedTime: number) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(`Table: ${tableName}`, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
  
  let finalY = 40;

  const sessionEndTime = new Date(bill.billDate);
  const sessionStartTime = new Date(sessionEndTime.getTime() - elapsedTime * 1000);

  // Session & Payment Details
  doc.autoTable({
    startY: finalY,
    head: [['Session & Payment Details']],
    body: [
        ['Billing Date', format(sessionEndTime, 'PPP')],
        ['Start Time', format(sessionStartTime, 'p')],
        ['End Time', format(sessionEndTime, 'p')],
        ['Total Duration', formatTime(elapsedTime)],
        ['Payment Method', bill.paymentMethod.toUpperCase()],
    ],
    theme: 'grid',
    headStyles: { fillColor: [38, 166, 154], halign: 'center' }, // Teal
    columnStyles: {
        0: { fontStyle: 'bold' },
    }
  });
  finalY = doc.autoTable.previous.finalY + 10;


  // Items Breakdown (Table & Products)
  doc.autoTable({
    startY: finalY,
    head: [['Description', 'Rate / Price', 'Qty / Time', 'Amount (INR)']],
    body: [
        // Table Cost Row
        [
            'Table Time', 
            `₹${(bill.tableBill / (elapsedTime / 3600)).toFixed(2)} / hr`, // Calculate hourly rate
            formatTime(elapsedTime), 
            `₹${bill.tableBill.toFixed(2)}`
        ],
        // Product Cost Rows
        ...bill.sessionItems.map(item => [
            item.product.name,
            `₹${item.product.price.toFixed(2)}`,
            item.quantity,
            `₹${(item.product.price * item.quantity).toFixed(2)}`
        ]),
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] }, // Blue
    foot: [
        [
            { content: 'Total Amount', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: `₹${bill.totalAmount.toFixed(2)}`, styles: { fontStyle: 'bold' } }
        ],
        [
            { content: 'Amount Paid', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: `₹${bill.amountPaid.toFixed(2)}`, styles: { fontStyle: 'bold' } }
        ],
        [
            { content: 'Balance', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: `₹${(bill.totalAmount - bill.amountPaid).toFixed(2)}`, styles: { fontStyle: 'bold' } }
        ]
    ],
    footStyles: {
        fillColor: [236, 240, 241], // Light gray
        textColor: [44, 62, 80] // Dark text
    }
  });
  finalY = doc.autoTable.previous.finalY + 15;


  // Thank you note
  doc.setFontSize(12);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for playing at THE OX SNOOKER!', doc.internal.pageSize.getWidth() / 2, finalY, { align: 'center' });


  // Save the PDF
  doc.save(`Invoice-${tableName}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`);
}
