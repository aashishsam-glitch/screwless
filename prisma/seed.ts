import { PrismaClient, Sector, Scale, RiskCategory, Stage } from '@prisma/client'

const { encryptField } = require('../lib/crypto')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.documentComment.deleteMany()
  await prisma.applicationDocument.deleteMany()
  await prisma.approvalTypeDocumentRequirement.deleteMany()
  await prisma.document.deleteMany()
  await prisma.businessInfo.deleteMany()
  await prisma.personalInfo.deleteMany()
  await prisma.application.deleteMany()
  await prisma.approvalRule.deleteMany()
  await prisma.approvalType.deleteMany()
  await prisma.scheme.deleteMany()
  await prisma.applicantProfile.deleteMany()
  await prisma.user.deleteMany()

  // ─── Officer Accounts ──────────────────────────
  // For demo: officers for each department
  const officers = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Rajesh Patil',
        email: 'officer.fire@demo.gov.in',
        phone: '9900000001',
        role: 'officer',
        officerDepartment: 'fire_dept',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Sunita Deshmukh',
        email: 'officer.pollution@demo.gov.in',
        phone: '9900000002',
        role: 'officer',
        officerDepartment: 'mpcb',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Amit Kulkarni',
        email: 'officer.factory@demo.gov.in',
        phone: '9900000003',
        role: 'officer',
        officerDepartment: 'dish',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Priya Joshi',
        email: 'officer.municipal@demo.gov.in',
        phone: '9900000004',
        role: 'officer',
        officerDepartment: 'municipal_corp',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Vikram Shinde',
        email: 'officer.labour@demo.gov.in',
        phone: '9900000005',
        role: 'officer',
        officerDepartment: 'labour_dept',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Meena Bhosale',
        email: 'officer.midc@demo.gov.in',
        phone: '9900000006',
        role: 'officer',
        officerDepartment: 'midc',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Sanjay Wagh',
        email: 'officer.electricity@demo.gov.in',
        phone: '9900000007',
        role: 'officer',
        officerDepartment: 'msedcl',
      },
    }),
    prisma.user.create({
      data: {
        name: 'Kavita Pawar',
        email: 'officer.water@demo.gov.in',
        phone: '9900000008',
        role: 'officer',
        officerDepartment: 'water_resources',
      },
    }),
  ])
  console.log(`✅ Created ${officers.length} officer accounts`)

  // ─── A demo applicant account ──────────────────
  const demoApplicant = await prisma.user.create({
    data: {
      name: 'Demo Applicant',
      email: 'applicant@demo.com',
      phone: '9800000001',
      role: 'applicant',
    },
  })
  console.log('✅ Created demo applicant account')

  // ─── Approval Types ────────────────────────────
  // Create in order so we can reference IDs for depends_on

  const landAllotment = await prisma.approvalType.create({
    data: {
      name: 'Land Allotment / MIDC Plot',
      department: 'midc',
      description: 'Allotment of industrial plot through MIDC (Maharashtra Industrial Development Corporation). Required for new units setting up in MIDC industrial areas.',
    },
  })

  const buildingPlan = await prisma.approvalType.create({
    data: {
      name: 'Building Plan Approval',
      department: 'municipal_corp',
      description: 'Approval of building/factory construction plans by the local municipal corporation or planning authority. Must comply with Development Control Regulations.',
    },
  })

  const factoryLicense = await prisma.approvalType.create({
    data: {
      name: 'Factory License',
      department: 'dish',
      description: 'License under the Factories Act, 1948 issued by the Directorate of Industrial Safety & Health (DISH). Required for any premises employing 10+ workers with power or 20+ without.',
      dependsOnId: buildingPlan.id, // Depends on building plan approval
    },
  })

  const fireNOC = await prisma.approvalType.create({
    data: {
      name: 'Fire NOC',
      department: 'fire_dept',
      description: 'No Objection Certificate from the Fire Department. Required for industrial buildings to certify fire safety measures, equipment, and escape routes are adequate.',
      dependsOnId: buildingPlan.id, // Depends on building plan approval
    },
  })

  const pollutionNOC = await prisma.approvalType.create({
    data: {
      name: 'Pollution NOC / Consent to Establish',
      department: 'mpcb',
      description: 'Consent to Establish (CTE) from Maharashtra Pollution Control Board under the Water Act, 1974 and Air Act, 1981. Required before starting any industrial activity that may generate pollution.',
    },
  })

  const electricityConn = await prisma.approvalType.create({
    data: {
      name: 'Electricity Connection (HT/LT)',
      department: 'msedcl',
      description: 'Industrial electricity connection from MSEDCL (Maharashtra State Electricity Distribution Co. Ltd). HT connection for loads above 100 kVA, LT for smaller loads.',
    },
  })

  const labourReg = await prisma.approvalType.create({
    data: {
      name: 'Labour Registration',
      department: 'labour_dept',
      description: 'Registration under various labour laws including Shops & Establishments Act, Contract Labour Act, and Employee Provident Fund. Required for all establishments employing workers.',
    },
  })

  const waterNOC = await prisma.approvalType.create({
    data: {
      name: 'Water NOC / Connection',
      department: 'water_resources',
      description: 'No Objection Certificate for industrial water usage and/or water supply connection. Required for units with significant water consumption (>50 KLD).',
    },
  })

  const shopsReg = await prisma.approvalType.create({
    data: {
      name: 'Shops & Establishment Registration',
      department: 'municipal_corp',
      description: 'Registration under the Maharashtra Shops and Establishments (Regulation of Employment and Conditions of Service) Act. Required for all commercial establishments.',
    },
  })

  const gstReg = await prisma.approvalType.create({
    data: {
      name: 'GST Registration',
      department: 'tax_dept',
      description: 'Registration under the Goods and Services Tax Act. Mandatory for businesses with turnover exceeding the threshold limit (currently ₹40 lakhs for goods, ₹20 lakhs for services).',
    },
  })

  const approvalTypes = [landAllotment, buildingPlan, factoryLicense, fireNOC, pollutionNOC, electricityConn, labourReg, waterNOC, shopsReg, gstReg]
  console.log(`✅ Created ${approvalTypes.length} approval types`)

  // ─── Approval Rules ────────────────────────────
  // Maharashtra has moved ~20 of 33 approvals to self-certification
  // Green/White → mostly self-certifiable, Orange/Red → mostly not
  // null in a field means "applies to all values of that field"

  const rules = await prisma.approvalRule.createMany({
    data: [
      // -- Factory License: required for all manufacturing, food_processing, chemical, pharma, textiles --
      { approvalTypeId: factoryLicense.id, appliesToSector: 'manufacturing', appliesToScale: null, appliesToRiskCategory: 'green', appliesToZone: null, isSelfCertifiable: true },
      { approvalTypeId: factoryLicense.id, appliesToSector: 'manufacturing', appliesToScale: null, appliesToRiskCategory: 'white', appliesToZone: null, isSelfCertifiable: true },
      { approvalTypeId: factoryLicense.id, appliesToSector: 'manufacturing', appliesToScale: null, appliesToRiskCategory: 'orange', appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: factoryLicense.id, appliesToSector: 'manufacturing', appliesToScale: null, appliesToRiskCategory: 'red', appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: factoryLicense.id, appliesToSector: 'chemical', appliesToScale: null, appliesToRiskCategory: null, appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: factoryLicense.id, appliesToSector: 'pharma', appliesToScale: null, appliesToRiskCategory: null, appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: factoryLicense.id, appliesToSector: 'food_processing', appliesToScale: null, appliesToRiskCategory: null, appliesToZone: null, isSelfCertifiable: true },
      { approvalTypeId: factoryLicense.id, appliesToSector: 'textiles', appliesToScale: null, appliesToRiskCategory: 'green', appliesToZone: null, isSelfCertifiable: true },

      // -- Building Plan Approval: required for all new units and expansions --
      { approvalTypeId: buildingPlan.id, appliesToSector: null, appliesToScale: null, appliesToRiskCategory: 'green', appliesToZone: null, isSelfCertifiable: true },
      { approvalTypeId: buildingPlan.id, appliesToSector: null, appliesToScale: null, appliesToRiskCategory: 'white', appliesToZone: null, isSelfCertifiable: true },
      { approvalTypeId: buildingPlan.id, appliesToSector: null, appliesToScale: null, appliesToRiskCategory: 'orange', appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: buildingPlan.id, appliesToSector: null, appliesToScale: null, appliesToRiskCategory: 'red', appliesToZone: null, isSelfCertifiable: false },

      // -- Fire NOC: required for all, self-certifiable for green/white --
      { approvalTypeId: fireNOC.id, appliesToSector: null, appliesToScale: null, appliesToRiskCategory: 'green', appliesToZone: null, isSelfCertifiable: true },
      { approvalTypeId: fireNOC.id, appliesToSector: null, appliesToScale: null, appliesToRiskCategory: 'white', appliesToZone: null, isSelfCertifiable: true },
      { approvalTypeId: fireNOC.id, appliesToSector: null, appliesToScale: null, appliesToRiskCategory: 'orange', appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: fireNOC.id, appliesToSector: null, appliesToScale: null, appliesToRiskCategory: 'red', appliesToZone: null, isSelfCertifiable: false },

      // -- Pollution NOC: required for chemical, pharma, manufacturing (orange/red) --
      { approvalTypeId: pollutionNOC.id, appliesToSector: 'chemical', appliesToScale: null, appliesToRiskCategory: null, appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: pollutionNOC.id, appliesToSector: 'pharma', appliesToScale: null, appliesToRiskCategory: null, appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: pollutionNOC.id, appliesToSector: 'manufacturing', appliesToScale: null, appliesToRiskCategory: 'orange', appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: pollutionNOC.id, appliesToSector: 'manufacturing', appliesToScale: null, appliesToRiskCategory: 'red', appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: pollutionNOC.id, appliesToSector: 'food_processing', appliesToScale: null, appliesToRiskCategory: 'orange', appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: pollutionNOC.id, appliesToSector: 'food_processing', appliesToScale: null, appliesToRiskCategory: 'red', appliesToZone: null, isSelfCertifiable: false },

      // -- Electricity Connection: required for all sectors --
      { approvalTypeId: electricityConn.id, appliesToSector: null, appliesToScale: null, appliesToRiskCategory: null, appliesToZone: null, isSelfCertifiable: true },

      // -- Labour Registration: required for all --
      { approvalTypeId: labourReg.id, appliesToSector: null, appliesToScale: null, appliesToRiskCategory: null, appliesToZone: null, isSelfCertifiable: true },

      // -- Land Allotment: only for those in notified industrial zones --
      { approvalTypeId: landAllotment.id, appliesToSector: null, appliesToScale: null, appliesToRiskCategory: null, appliesToZone: true, isSelfCertifiable: false },

      // -- Water NOC: required for chemical, pharma, food_processing, manufacturing (medium/large) --
      { approvalTypeId: waterNOC.id, appliesToSector: 'chemical', appliesToScale: null, appliesToRiskCategory: null, appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: waterNOC.id, appliesToSector: 'pharma', appliesToScale: null, appliesToRiskCategory: null, appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: waterNOC.id, appliesToSector: 'food_processing', appliesToScale: 'medium', appliesToRiskCategory: null, appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: waterNOC.id, appliesToSector: 'food_processing', appliesToScale: 'large', appliesToRiskCategory: null, appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: waterNOC.id, appliesToSector: 'manufacturing', appliesToScale: 'large', appliesToRiskCategory: null, appliesToZone: null, isSelfCertifiable: false },

      // -- Shops & Establishment Registration: for all --
      { approvalTypeId: shopsReg.id, appliesToSector: null, appliesToScale: null, appliesToRiskCategory: null, appliesToZone: null, isSelfCertifiable: true },

      // -- GST Registration: for all --
      { approvalTypeId: gstReg.id, appliesToSector: null, appliesToScale: null, appliesToRiskCategory: null, appliesToZone: null, isSelfCertifiable: true },
    ],
  })
  console.log(`✅ Created ${rules.count} approval rules`)

  // ─── Schemes ───────────────────────────────────
  // TODO: verify against actual Maharashtra Industrial Policy

  const schemes = await prisma.scheme.createMany({
    data: [
      {
        name: 'Capital Investment Subsidy',
        description: 'Subsidy on fixed capital investment for new MSME units in Maharashtra. Higher subsidy rates for units in less-developed regions (C, D, D+ areas).',
        eligibilitySector: null,
        eligibilityScale: 'micro',
        eligibilityDistrict: null,
        subsidyDetail: 'Up to 30% of fixed capital investment (max ₹50 lakhs) for Micro enterprises. Up to 20% (max ₹1 crore) for Small enterprises in C/D/D+ areas.',
        sourceUrl: 'https://maitri.mahaonline.gov.in', // TODO: verify against actual Maharashtra Industrial Policy
      },
      {
        name: 'Capital Investment Subsidy (Small)',
        description: 'Subsidy on fixed capital investment for new small-scale units in Maharashtra.',
        eligibilitySector: null,
        eligibilityScale: 'small',
        eligibilityDistrict: null,
        subsidyDetail: 'Up to 20% of fixed capital investment (max ₹1 crore) for Small enterprises. Higher rates in D/D+ areas.',
        sourceUrl: 'https://maitri.mahaonline.gov.in', // TODO: verify against actual Maharashtra Industrial Policy
      },
      {
        name: 'Interest Subsidy Scheme',
        description: 'Subsidy on interest paid on term loans taken for setting up new industrial units or expansion projects.',
        eligibilitySector: 'manufacturing',
        eligibilityScale: null,
        eligibilityDistrict: null,
        subsidyDetail: 'Interest subsidy of 5% p.a. on term loans (max ₹25 lakhs per year) for a period of 5 years from the date of commercial production.',
        sourceUrl: 'https://maitri.mahaonline.gov.in', // TODO: verify against actual Maharashtra Industrial Policy
      },
      {
        name: 'Electricity Duty Exemption',
        description: 'Exemption from electricity duty for new industrial units in eligible areas of Maharashtra.',
        eligibilitySector: null,
        eligibilityScale: null,
        eligibilityDistrict: null,
        subsidyDetail: 'Full exemption from electricity duty for 7 years for units in C/D/D+ areas. 5 years for units in A/B areas. Applicable from the date of commencement of production.',
        sourceUrl: 'https://maitri.mahaonline.gov.in', // TODO: verify against actual Maharashtra Industrial Policy
      },
      {
        name: 'Stamp Duty Exemption',
        description: 'Exemption from stamp duty on purchase/lease of land and buildings for industrial purposes.',
        eligibilitySector: null,
        eligibilityScale: null,
        eligibilityDistrict: 'Nashik',
        subsidyDetail: '100% stamp duty exemption in D/D+ areas, 75% in C areas, 50% in B areas. Valid for land/building transactions for new industrial units.',
        sourceUrl: 'https://maitri.mahaonline.gov.in', // TODO: verify against actual Maharashtra Industrial Policy
      },
      {
        name: 'Technology Upgradation Scheme',
        description: 'Financial assistance for technology upgradation and modernization of existing MSME units.',
        eligibilitySector: 'manufacturing',
        eligibilityScale: 'small',
        eligibilityDistrict: null,
        subsidyDetail: '15% of cost of technology upgradation (max ₹25 lakhs). Covers machinery, equipment, and technology acquisition costs.',
        sourceUrl: 'https://maitri.mahaonline.gov.in', // TODO: verify against actual Maharashtra Industrial Policy
      },
      {
        name: 'Quality Certification Reimbursement',
        description: 'Reimbursement of expenses incurred for obtaining quality certifications (ISO, BIS, HACCP, etc.).',
        eligibilitySector: 'food_processing',
        eligibilityScale: null,
        eligibilityDistrict: null,
        subsidyDetail: 'Reimbursement of up to 75% of certification costs (max ₹1 lakh) for MSMEs. Covers ISO 9001, ISO 14001, HACCP, BIS, and other recognized quality certifications.',
        sourceUrl: 'https://maitri.mahaonline.gov.in', // TODO: verify against actual Maharashtra Industrial Policy
      },
      {
        name: 'Employment Generation Subsidy',
        description: 'Subsidy linked to employment generation by new industrial units.',
        eligibilitySector: null,
        eligibilityScale: 'medium',
        eligibilityDistrict: null,
        subsidyDetail: 'Annual subsidy of ₹5,000 per employee for units employing 50+ workers in D/D+ areas. Valid for 5 years. Additional ₹2,500/employee for SC/ST/women employees.',
        sourceUrl: 'https://maitri.mahaonline.gov.in', // TODO: verify against actual Maharashtra Industrial Policy
      },
    ],
  })
  console.log(`✅ Created ${schemes.count} schemes`)

  // ─── Document Requirements per Approval Type ────
  const docReqs = await prisma.approvalTypeDocumentRequirement.createMany({
    data: [
      // Building Plan Approval
      { approvalTypeId: buildingPlan.id, documentType: 'land_ownership_proof', isMandatory: true },
      { approvalTypeId: buildingPlan.id, documentType: 'building_plan_copy', isMandatory: true },
      { approvalTypeId: buildingPlan.id, documentType: 'pan', isMandatory: true },
      { approvalTypeId: buildingPlan.id, documentType: 'aadhar', isMandatory: false },

      // Factory License
      { approvalTypeId: factoryLicense.id, documentType: 'pan', isMandatory: true },
      { approvalTypeId: factoryLicense.id, documentType: 'gstin_certificate', isMandatory: true },
      { approvalTypeId: factoryLicense.id, documentType: 'land_ownership_proof', isMandatory: true },
      { approvalTypeId: factoryLicense.id, documentType: 'factory_layout_plan', isMandatory: true },
      { approvalTypeId: factoryLicense.id, documentType: 'building_plan_copy', isMandatory: false },

      // Fire NOC
      { approvalTypeId: fireNOC.id, documentType: 'building_plan_copy', isMandatory: true },
      { approvalTypeId: fireNOC.id, documentType: 'fire_safety_layout', isMandatory: true },
      { approvalTypeId: fireNOC.id, documentType: 'noc_previous', isMandatory: false },

      // Pollution NOC
      { approvalTypeId: pollutionNOC.id, documentType: 'factory_layout_plan', isMandatory: true },
      { approvalTypeId: pollutionNOC.id, documentType: 'pollution_control_cert', isMandatory: true },
      { approvalTypeId: pollutionNOC.id, documentType: 'water_usage_plan', isMandatory: false },

      // Electricity Connection
      { approvalTypeId: electricityConn.id, documentType: 'land_ownership_proof', isMandatory: true },
      { approvalTypeId: electricityConn.id, documentType: 'electricity_bill', isMandatory: false },
      { approvalTypeId: electricityConn.id, documentType: 'pan', isMandatory: true },

      // Labour Registration
      { approvalTypeId: labourReg.id, documentType: 'pan', isMandatory: true },
      { approvalTypeId: labourReg.id, documentType: 'aadhar', isMandatory: true },
      { approvalTypeId: labourReg.id, documentType: 'gstin_certificate', isMandatory: false },
      { approvalTypeId: labourReg.id, documentType: 'labour_license_copy', isMandatory: false },

      // Water NOC
      { approvalTypeId: waterNOC.id, documentType: 'water_usage_plan', isMandatory: true },
      { approvalTypeId: waterNOC.id, documentType: 'land_ownership_proof', isMandatory: true },
      { approvalTypeId: waterNOC.id, documentType: 'pollution_control_cert', isMandatory: false },

      // Land Allotment
      { approvalTypeId: landAllotment.id, documentType: 'pan', isMandatory: true },
      { approvalTypeId: landAllotment.id, documentType: 'aadhar', isMandatory: true },
      { approvalTypeId: landAllotment.id, documentType: 'incorporation_cert', isMandatory: false },

      // Shops & Establishment
      { approvalTypeId: shopsReg.id, documentType: 'pan', isMandatory: true },
      { approvalTypeId: shopsReg.id, documentType: 'aadhar', isMandatory: true },
      { approvalTypeId: shopsReg.id, documentType: 'electricity_bill', isMandatory: false },

      // GST Registration
      { approvalTypeId: gstReg.id, documentType: 'pan', isMandatory: true },
      { approvalTypeId: gstReg.id, documentType: 'aadhar', isMandatory: true },
      { approvalTypeId: gstReg.id, documentType: 'incorporation_cert', isMandatory: false },
      { approvalTypeId: gstReg.id, documentType: 'udyam_certificate', isMandatory: false },
    ],
  })
  console.log(`✅ Created ${docReqs.count} document requirements`)

  // ─── Demo Applicant Personal & Business Info ────
  await prisma.personalInfo.create({
    data: {
      userId: demoApplicant.id,
      fullName: 'Rajendra Mehta',
      dob: '1985-06-15',
      aadharEncrypted: encryptField('234567891234'),
      panEncrypted: encryptField('ABCDE1234F'),
      address: '42, Industrial Estate, Hadapsar, Pune 411028',
      contactEmail: 'rajendra@shreeindustries.com',
      contactPhone: '9876543210',
      alternateContact: '020-26871234',
    },
  })
  console.log('✅ Created demo applicant personal info')

  await prisma.businessInfo.create({
    data: {
      userId: demoApplicant.id,
      businessName: 'Shree Industries Pvt. Ltd.',
      businessType: 'pvt_ltd',
      gstin: '27ABCDE1234F1Z5',
      udyamRegistrationNumber: 'UDYAM-MH-27-0012345',
      incorporationDate: '2018-03-20',
    },
  })
  console.log('✅ Created demo applicant business info')

  // ─── Sample Documents (Document Vault) ─────────
  const now = new Date()
  const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000) // Expiring soon
  const expired30DaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // Already expired
  const in2Years = new Date(now.getTime() + 730 * 24 * 60 * 60 * 1000) // Valid for 2 years

  await prisma.document.createMany({
    data: [
      {
        userId: demoApplicant.id,
        documentType: 'pan',
        fileUrl: '/uploads/demo/pan_card_demo.pdf',
        fileName: 'PAN_Card_ABCDE1234F.pdf',
        expiryDate: null, // PAN doesn't expire
      },
      {
        userId: demoApplicant.id,
        documentType: 'gstin_certificate',
        fileUrl: '/uploads/demo/gstin_cert_demo.pdf',
        fileName: 'GSTIN_Certificate.pdf',
        expiryDate: in15Days, // Expiring soon — triggers alert!
      },
      {
        userId: demoApplicant.id,
        documentType: 'pollution_control_cert',
        fileUrl: '/uploads/demo/pollution_cert_demo.pdf',
        fileName: 'MPCB_Consent_Certificate.pdf',
        expiryDate: expired30DaysAgo, // Already expired — triggers alert!
      },
      {
        userId: demoApplicant.id,
        documentType: 'land_ownership_proof',
        fileUrl: '/uploads/demo/land_deed_demo.pdf',
        fileName: 'Land_Ownership_Deed.pdf',
        expiryDate: in2Years, // Valid
      },
    ],
  })
  console.log('✅ Created 4 sample documents in vault')

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📋 Demo Accounts:')
  console.log('────────────────────────────────────────')
  officers.forEach(o => {
    console.log(`  Officer: ${o.name} | ${o.email} | Dept: ${o.officerDepartment}`)
  })
  console.log(`  Applicant: ${demoApplicant.name} | ${demoApplicant.email}`)
  console.log('────────────────────────────────────────')
  console.log('Use any of the above emails to log in (OTP is logged to console)\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
