/**
 * PDF Generator Service for Tax Documents
 *
 * Generates donation receipts and annual summaries using PDFKit
 */

import PDFDocument from 'pdfkit'

/**
 * Format currency for display
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

/**
 * Format date for display
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Generate a donation receipt PDF
 *
 * @param {Object} data - Receipt data
 * @param {string} data.receiptNumber - Unique receipt number
 * @param {string} data.donorName - Donor's name
 * @param {string} data.donorEmail - Donor's email
 * @param {number} data.amount - Donation amount in dollars
 * @param {string} data.donationDate - Date of donation
 * @param {string} data.description - Description of what was donated for
 * @param {Object} data.organization - Organization details
 * @param {string} data.organization.name - Organization name
 * @param {string} data.organization.ein - Tax ID (EIN)
 * @param {string} data.organization.address - Street address
 * @param {string} data.organization.city - City
 * @param {string} data.organization.state - State
 * @param {string} data.organization.zipcode - ZIP code
 * @param {string} data.organization.email - Contact email
 * @param {string} data.organization.phone - Contact phone
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generateDonationReceipt(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margin: 50,
        info: {
          Title: `Donation Receipt - ${data.receiptNumber}`,
          Author: 'KC Digital Drive',
          Subject: 'Tax-Deductible Donation Receipt',
        },
      })

      const chunks = []
      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      const pageWidth = doc.page.width - 100 // Account for margins

      // ===== HEADER =====
      // Organization Name (large, bold)
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#1b5858')
        .text(data.organization.name || 'Organization', { align: 'center' })

      doc.moveDown(0.3)

      // Organization Address
      doc.fontSize(10).font('Helvetica').fillColor('#666666')

      const addressParts = []
      if (data.organization.address) addressParts.push(data.organization.address)
      if (data.organization.city && data.organization.state) {
        addressParts.push(
          `${data.organization.city}, ${data.organization.state} ${data.organization.zipcode || ''}`.trim()
        )
      }
      if (addressParts.length > 0) {
        doc.text(addressParts.join(' | '), { align: 'center' })
      }

      // EIN
      if (data.organization.ein) {
        doc.text(`EIN: ${data.organization.ein}`, { align: 'center' })
      }

      doc.moveDown(1.5)

      // ===== RECEIPT TITLE =====
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#0a0a0a')
        .text('DONATION RECEIPT', { align: 'center' })

      doc.moveDown(0.3)

      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#666666')
        .text(`Receipt #: ${data.receiptNumber}`, { align: 'center' })

      doc.moveDown(1.5)

      // ===== DIVIDER =====
      doc
        .strokeColor('#e5e5e5')
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .stroke()

      doc.moveDown(1)

      // ===== RECEIPT DETAILS =====
      const leftColumn = 50
      const rightColumn = 200
      const startY = doc.y

      doc.fontSize(11).font('Helvetica').fillColor('#737373')

      // Date
      doc.text('Date:', leftColumn, startY)
      doc
        .font('Helvetica-Bold')
        .fillColor('#0a0a0a')
        .text(formatDate(data.donationDate), rightColumn, startY)

      // Donor
      doc
        .font('Helvetica')
        .fillColor('#737373')
        .text('Donor:', leftColumn, startY + 25)
      doc
        .font('Helvetica-Bold')
        .fillColor('#0a0a0a')
        .text(data.donorName || 'Anonymous Donor', rightColumn, startY + 25)

      // Email (if provided)
      if (data.donorEmail) {
        doc
          .font('Helvetica')
          .fillColor('#737373')
          .text('Email:', leftColumn, startY + 50)
        doc
          .font('Helvetica')
          .fillColor('#0a0a0a')
          .text(data.donorEmail, rightColumn, startY + 50)
      }

      // Amount
      const amountY = data.donorEmail ? startY + 75 : startY + 50
      doc.font('Helvetica').fillColor('#737373').text('Amount:', leftColumn, amountY)
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#1b5858')
        .text(formatCurrency(data.amount), rightColumn, amountY)

      // Description
      if (data.description) {
        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor('#737373')
          .text('Purpose:', leftColumn, amountY + 30)
        doc
          .font('Helvetica')
          .fillColor('#0a0a0a')
          .text(data.description, rightColumn, amountY + 30, { width: pageWidth - 150 })
      }

      doc.y = amountY + (data.description ? 70 : 40)
      doc.moveDown(1.5)

      // ===== DIVIDER =====
      doc
        .strokeColor('#e5e5e5')
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .stroke()

      doc.moveDown(1.5)

      // ===== TAX STATEMENT =====
      doc.fontSize(10).font('Helvetica').fillColor('#0a0a0a')

      doc.text(
        'This receipt confirms your tax-deductible charitable contribution. ' +
          'No goods or services were provided in exchange for this donation.',
        50,
        doc.y,
        { width: pageWidth, align: 'center' }
      )

      doc.moveDown(1)

      doc.text(
        `${data.organization.name || 'This organization'} is a registered 501(c)(3) nonprofit organization. ` +
          'Your donation may be tax-deductible to the extent allowed by law. ' +
          'Please retain this receipt for your tax records.',
        50,
        doc.y,
        { width: pageWidth, align: 'center' }
      )

      doc.moveDown(2)

      // ===== FOOTER =====
      doc
        .fontSize(9)
        .fillColor('#999999')
        .text(
          'This receipt was generated by KC Digital Drive. ' +
            'For questions about your donation, please contact the organization directly.',
          50,
          doc.y,
          { width: pageWidth, align: 'center' }
        )

      // Contact info
      if (data.organization.email || data.organization.phone) {
        doc.moveDown(0.5)
        const contactParts = []
        if (data.organization.email) contactParts.push(data.organization.email)
        if (data.organization.phone) contactParts.push(data.organization.phone)
        doc.text(contactParts.join(' | '), { align: 'center' })
      }

      // Platform branding at bottom
      doc.moveDown(2)
      doc.fontSize(8).fillColor('#cccccc').text('Powered by KC Digital Drive', { align: 'center' })

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Generate an annual donation summary PDF
 *
 * @param {Object} data - Summary data
 * @param {string} data.donorName - Donor's name
 * @param {string} data.donorEmail - Donor's email
 * @param {number} data.year - Tax year
 * @param {Array} data.donations - Array of donation records
 * @param {number} data.totalAmount - Total donations for the year
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generateAnnualSummary(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margin: 50,
        info: {
          Title: `Annual Donation Summary - ${data.year}`,
          Author: 'KC Digital Drive',
          Subject: `Tax Year ${data.year} Donation Summary`,
        },
      })

      const chunks = []
      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      const pageWidth = doc.page.width - 100

      // ===== HEADER =====
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#1b5858')
        .text('KC Digital Drive', { align: 'center' })

      doc.moveDown(0.5)

      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#0a0a0a')
        .text(`Annual Donation Summary - ${data.year}`, { align: 'center' })

      doc.moveDown(0.5)

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#666666')
        .text(`Generated on ${formatDate(new Date())}`, { align: 'center' })

      doc.moveDown(1.5)

      // ===== DONOR INFO =====
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0a0a0a').text('Donor Information')

      doc.moveDown(0.5)

      doc.fontSize(11).font('Helvetica').fillColor('#0a0a0a')

      doc.text(`Name: ${data.donorName || 'Anonymous Donor'}`)
      if (data.donorEmail) {
        doc.text(`Email: ${data.donorEmail}`)
      }

      doc.moveDown(1.5)

      // ===== SUMMARY BOX =====
      const boxY = doc.y
      const boxHeight = 80

      doc.rect(50, boxY, pageWidth, boxHeight).fillAndStroke('#f5f5f5', '#e5e5e5')

      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#737373')
        .text('Total Tax-Deductible Donations', 60, boxY + 15)

      doc
        .fontSize(28)
        .font('Helvetica-Bold')
        .fillColor('#1b5858')
        .text(formatCurrency(data.totalAmount), 60, boxY + 35)

      doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor('#737373')
        .text(
          `${data.donations.length} donation${data.donations.length !== 1 ? 's' : ''} in ${data.year}`,
          60,
          boxY + 65
        )

      doc.y = boxY + boxHeight + 20

      // ===== DONATIONS TABLE =====
      doc.moveDown(1)

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0a0a0a').text('Donation Details')

      doc.moveDown(0.5)

      // Table header
      const tableTop = doc.y
      const col1 = 50 // Date
      const col2 = 140 // Organization
      const col3 = 380 // Receipt #
      const col4 = 480 // Amount

      doc.fontSize(9).font('Helvetica-Bold').fillColor('#737373')

      doc.text('Date', col1, tableTop)
      doc.text('Organization', col2, tableTop)
      doc.text('Receipt #', col3, tableTop)
      doc.text('Amount', col4, tableTop)

      doc
        .strokeColor('#e5e5e5')
        .lineWidth(1)
        .moveTo(50, tableTop + 15)
        .lineTo(doc.page.width - 50, tableTop + 15)
        .stroke()

      // Table rows
      let rowY = tableTop + 25
      doc.font('Helvetica').fillColor('#0a0a0a')

      for (const donation of data.donations) {
        // Check if we need a new page
        if (rowY > doc.page.height - 100) {
          doc.addPage()
          rowY = 50
        }

        doc.fontSize(9)
        doc.text(formatDate(donation.date), col1, rowY, { width: 80 })
        doc.text(donation.organizationName || 'Organization', col2, rowY, { width: 230 })
        doc.text(donation.receiptNumber || '-', col3, rowY, { width: 90 })
        doc.font('Helvetica-Bold').text(formatCurrency(donation.amount), col4, rowY)
        doc.font('Helvetica')

        rowY += 20
      }

      // Total row
      doc
        .strokeColor('#e5e5e5')
        .lineWidth(1)
        .moveTo(50, rowY)
        .lineTo(doc.page.width - 50, rowY)
        .stroke()

      rowY += 10

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0a0a0a').text('Total', col2, rowY)
      doc.fillColor('#1b5858').text(formatCurrency(data.totalAmount), col4, rowY)

      doc.y = rowY + 40

      // ===== TAX STATEMENT =====
      doc.moveDown(2)

      doc.fontSize(10).font('Helvetica').fillColor('#0a0a0a')

      doc.text(
        'This summary documents your tax-deductible charitable contributions for the tax year indicated above. ' +
          'No goods or services were provided in exchange for these donations unless otherwise noted. ' +
          'Please retain this summary along with individual receipts for your tax records.',
        50,
        doc.y,
        { width: pageWidth, align: 'left' }
      )

      doc.moveDown(2)

      // ===== FOOTER =====
      doc
        .fontSize(9)
        .fillColor('#999999')
        .text(
          'For questions about your donations, please visit kcdime.org or contact support.',
          50,
          doc.y,
          { width: pageWidth, align: 'center' }
        )

      doc.moveDown(2)
      doc.fontSize(8).fillColor('#cccccc').text('Powered by KC Digital Drive', { align: 'center' })

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

export default {
  generateDonationReceipt,
  generateAnnualSummary,
}
