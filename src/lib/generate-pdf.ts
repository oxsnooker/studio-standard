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
  doc.text(tableName, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
  
  let finalY = 40;

  // Customer Details
  doc.autoTable({
    startY: finalY,
    head: [['Customer Details']],
    body: [
        [{ content: 'Payment Method:', styles: { fontStyle: 'bold' } }, bill.paymentMethod, { content: 'Billing Date:', styles: { fontStyle: 'bold' } }, format(new Date(bill.billDate), 'Pp')],
    ],
    theme: 'striped',
    headStyles: { fillColor: [38, 166, 154],halign: 'center' }, // Teal
    columnStyles: {
        0: { fontStyle: 'bold' },
        2: { fontStyle: 'bold' },
    }
  });
  finalY = doc.autoTable.previous.finalY + 10;


  // Purchased Items
  if (bill.sessionItems && bill.sessionItems.length > 0) {
    doc.autoTable({
        startY: finalY,
        head: [['Purchased Items']],
        body: [],
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], halign: 'center' }, // Blue
        didDrawPage: (data) => {
            finalY = data.cursor.y;
        }
    });

    const itemBody = bill.sessionItems.map(item => [
      item.product.name,
      item.quantity,
      `Rs ${item.product.price.toFixed(2)}`,
      `Rs ${(item.product.price * item.quantity).toFixed(2)}`,
    ]);

    doc.autoTable({
      startY: finalY,
      head: [['Item', 'Quantity', 'Price per Unit (Rs)', 'Total Price (Rs)']],
      body: itemBody,
      theme: 'grid',
    });
    finalY = doc.autoTable.previous.finalY + 10;
  }

  // Timer Details
  const sessionEndTime = new Date(bill.billDate);
  const sessionStartTime = new Date(sessionEndTime.getTime() - elapsedTime * 1000);

  doc.autoTable({
    startY: finalY,
    head: [['Timer Details']],
    body: [
        ['Started At', format(sessionStartTime, 'Pp'), 'Ended At', format(sessionEndTime, 'Pp')],
        ['Timer Duration', formatTime(elapsedTime), 'Timer Price (Rs)', `Rs ${bill.tableBill.toFixed(2)}`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [243, 156, 18], halign: 'center' }, // Orange
    columnStyles: {
        0: { fontStyle: 'bold' },
        2: { fontStyle: 'bold' },
    }
  });
  finalY = doc.autoTable.previous.finalY + 10;

  // Summary
  doc.autoTable({
    startY: finalY,
    head: [['Summary']],
    body: [
      ['Total Amount (Rs)', `Rs ${bill.totalAmount.toFixed(2)}`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [192, 57, 43], halign: 'center' }, // Red
    columnStyles: {
        0: { fontStyle: 'bold', halign: 'right' },
        1: { fontStyle: 'bold', halign: 'left' }
    }
  });


  // Save the PDF
  doc.save(`Invoice-${tableName}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
