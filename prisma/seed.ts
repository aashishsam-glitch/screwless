import { PrismaClient, Sector, Scale, RiskCategory, Stage } from '@prisma/client'

const { encryptField } = require('../lib/crypto')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.grievance.deleteMany()
  await prisma.inspectionOfficer.deleteMany()
  await prisma.inspection.deleteMany()
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

  // ─── Demo Applicant Account ────────────────────
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
      dependsOnId: buildingPlan.id,
    },
  })

  const fireNOC = await prisma.approvalType.create({
    data: {
      name: 'Fire NOC',
      department: 'fire_dept',
      description: 'No Objection Certificate from the Fire Department. Required for industrial buildings to certify fire safety measures, equipment, and escape routes are adequate.',
      dependsOnId: buildingPlan.id,
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
  const rules = await prisma.approvalRule.createMany({
    data: [
      { approvalTypeId: factoryLicense.id, appliesToSector: 'manufacturing', appliesToScale: null, appliesToRiskCategory: 'green', appliesToZone: null, isSelfCertifiable: true },
      { approvalTypeId: factoryLicense.id, appliesToSector: 'manufacturing', appliesToScale: null, appliesToRiskCategory: 'white', appliesToZone: null, isSelfCertifiable: true },
      { approvalTypeId: factoryLicense.id, appliesToSector: 'manufacturing', appliesToScale: null, appliesToRiskCategory: 'orange', appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: factoryLicense.id, appliesToSector: 'manufacturing', appliesToScale: null, appliesToRiskCategory: 'red', appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: factoryLicense.id, appliesToSector: 'chemical', appliesToScale: null, appliesToRiskCategory: null, appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: factoryLicense.id, appliesToSector: 'pharma', appliesToScale: null, appliesToRiskCategory: null, appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: factoryLicense.id, appliesToSector: 'food_processing', appliesToScale: null, appliesToRiskCategory: null, appliesToZone: null, isSelfCertifiable: true },
      { approvalTypeId: factoryLicense.id, appliesToSector: 'textiles', appliesToScale: null, appliesToRiskCategory: 'green', appliesToZone: null, isSelfCertifiable: true },

      { approvalTypeId: buildingPlan.id, appliesToSector: null, appliesToScale: null, appliesToRiskCategory: 'green', appliesToZone: null, isSelfCertifiable: true },
      { approvalTypeId: buildingPlan.id, appliesToSector: null, appliesToScale: null, appliesToRiskCategory: 'white', appliesToZone: null, isSelfCertifiable: true },
      { approvalTypeId: buildingPlan.id, appliesToSector: null, appliesToScale: null, appliesToRiskCategory: 'orange', appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: buildingPlan.id, appliesToSector: null, appliesToScale: null, appliesToRiskCategory: 'red', appliesToZone: null, isSelfCertifiable: false },

      { approvalTypeId: fireNOC.id, appliesToSector: null, appliesToScale: null, appliesToRiskCategory: 'green', appliesToZone: null, isSelfCertifiable: true },
      { approvalTypeId: fireNOC.id, appliesToSector: null, appliesToScale: null, appliesToRiskCategory: 'white', appliesToZone: null, isSelfCertifiable: true },
      { approvalTypeId: fireNOC.id, appliesToSector: null, appliesToScale: null, appliesToRiskCategory: 'orange', appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: fireNOC.id, appliesToSector: null, appliesToScale: null, appliesToRiskCategory: 'red', appliesToZone: null, isSelfCertifiable: false },

      { approvalTypeId: pollutionNOC.id, appliesToSector: 'chemical', appliesToScale: null, appliesToRiskCategory: null, appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: pollutionNOC.id, appliesToSector: 'pharma', appliesToScale: null, appliesToRiskCategory: null, appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: pollutionNOC.id, appliesToSector: 'manufacturing', appliesToScale: null, appliesToRiskCategory: 'orange', appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: pollutionNOC.id, appliesToSector: 'manufacturing', appliesToScale: null, appliesToRiskCategory: 'red', appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: pollutionNOC.id, appliesToSector: 'food_processing', appliesToScale: null, appliesToRiskCategory: 'orange', appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: pollutionNOC.id, appliesToSector: 'food_processing', appliesToScale: null, appliesToRiskCategory: 'red', appliesToZone: null, isSelfCertifiable: false },

      { approvalTypeId: electricityConn.id, appliesToSector: null, appliesToScale: null, appliesToRiskCategory: null, appliesToZone: null, isSelfCertifiable: true },
      { approvalTypeId: labourReg.id, appliesToSector: null, appliesToScale: null, appliesToRiskCategory: null, appliesToZone: null, isSelfCertifiable: true },
      { approvalTypeId: landAllotment.id, appliesToSector: null, appliesToScale: null, appliesToRiskCategory: null, appliesToZone: true, isSelfCertifiable: false },

      { approvalTypeId: waterNOC.id, appliesToSector: 'chemical', appliesToScale: null, appliesToRiskCategory: null, appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: waterNOC.id, appliesToSector: 'pharma', appliesToScale: null, appliesToRiskCategory: null, appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: waterNOC.id, appliesToSector: 'food_processing', appliesToScale: 'medium', appliesToRiskCategory: null, appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: waterNOC.id, appliesToSector: 'food_processing', appliesToScale: 'large', appliesToRiskCategory: null, appliesToZone: null, isSelfCertifiable: false },
      { approvalTypeId: waterNOC.id, appliesToSector: 'manufacturing', appliesToScale: 'large', appliesToRiskCategory: null, appliesToZone: null, isSelfCertifiable: false },

      { approvalTypeId: shopsReg.id, appliesToSector: null, appliesToScale: null, appliesToRiskCategory: null, appliesToZone: null, isSelfCertifiable: true },
      { approvalTypeId: gstReg.id, appliesToSector: null, appliesToScale: null, appliesToRiskCategory: null, appliesToZone: null, isSelfCertifiable: true },
    ],
  })
  console.log(`✅ Created ${rules.count} approval rules`)

  // ─── Verified Schemes (Maharashtra Industrial Policy) ───
  const schemes = await prisma.scheme.createMany({
    data: [
      {
        name: 'Capital Investment Subsidy (Micro)',
        description: 'Subsidy on fixed capital investment for new MSME units under Maharashtra Package Scheme of Incentives (PSI).',
        eligibilitySector: null,
        eligibilityScale: 'micro',
        eligibilityDistrict: null,
        subsidyDetail: 'Up to 30% of fixed capital investment (max ₹50 lakhs) for Micro enterprises in eligible categories.',
        sourceUrl: 'https://maitri.mahaonline.gov.in',
      },
      {
        name: 'Capital Investment Subsidy (Small)',
        description: 'Subsidy on fixed capital investment for new small-scale units under Maharashtra Package Scheme of Incentives.',
        eligibilitySector: null,
        eligibilityScale: 'small',
        eligibilityDistrict: null,
        subsidyDetail: 'Up to 20% of fixed capital investment (max ₹1 crore) for Small enterprises in C/D/D+ areas.',
        sourceUrl: 'https://maitri.mahaonline.gov.in',
      },
      {
        name: 'Interest Subsidy Scheme',
        description: 'Subsidy on interest paid on term loans taken for setting up new industrial units or expansion projects.',
        eligibilitySector: 'manufacturing',
        eligibilityScale: null,
        eligibilityDistrict: null,
        subsidyDetail: 'Interest subsidy of 5% p.a. on term loans (max ₹25 lakhs per year) for up to 5 years.',
        sourceUrl: 'https://maitri.mahaonline.gov.in',
      },
      {
        name: 'Electricity Duty Exemption',
        description: 'Exemption from electricity duty for new industrial units under Maharashtra Industrial Policy.',
        eligibilitySector: null,
        eligibilityScale: null,
        eligibilityDistrict: null,
        subsidyDetail: 'Full exemption from electricity duty for 7 years in C/D/D+ areas and 5 years in A/B areas.',
        sourceUrl: 'https://maitri.mahaonline.gov.in',
      },
      {
        name: 'Stamp Duty Exemption',
        description: 'Exemption from stamp duty on purchase/lease of land and buildings for industrial purposes.',
        eligibilitySector: null,
        eligibilityScale: null,
        eligibilityDistrict: 'Nashik',
        subsidyDetail: '100% stamp duty exemption in D/D+ areas, 75% in C areas, 50% in B areas for industrial land.',
        sourceUrl: 'https://maitri.mahaonline.gov.in',
      },
      {
        name: 'Technology Upgradation Scheme',
        description: 'Financial assistance for technology upgradation and modernization of existing MSME units.',
        eligibilitySector: 'manufacturing',
        eligibilityScale: 'small',
        eligibilityDistrict: null,
        subsidyDetail: '15% of cost of technology upgradation (max ₹25 lakhs) for qualifying machinery and equipment.',
        sourceUrl: 'https://maitri.mahaonline.gov.in',
      },
      {
        name: 'Quality Certification Reimbursement',
        description: 'Reimbursement of expenses incurred for obtaining quality certifications (ISO, BIS, HACCP, etc.).',
        eligibilitySector: 'food_processing',
        eligibilityScale: null,
        eligibilityDistrict: null,
        subsidyDetail: 'Reimbursement of up to 75% of certification costs (max ₹1 lakh) for recognized quality standards.',
        sourceUrl: 'https://maitri.mahaonline.gov.in',
      },
      {
        name: 'Employment Generation Subsidy',
        description: 'Subsidy linked to direct local employment generation by new industrial units.',
        eligibilitySector: null,
        eligibilityScale: 'medium',
        eligibilityDistrict: null,
        subsidyDetail: 'Annual subsidy of ₹5,000 per employee for units employing 50+ workers for 5 years.',
        sourceUrl: 'https://maitri.mahaonline.gov.in',
      },
    ],
  })
  console.log(`✅ Created ${schemes.count} schemes`)

  // ─── Document Requirements per Approval Type ────
  const docReqs = await prisma.approvalTypeDocumentRequirement.createMany({
    data: [
      { approvalTypeId: buildingPlan.id, documentType: 'land_ownership_proof', isMandatory: true },
      { approvalTypeId: buildingPlan.id, documentType: 'building_plan_copy', isMandatory: true },
      { approvalTypeId: buildingPlan.id, documentType: 'pan', isMandatory: true },
      { approvalTypeId: buildingPlan.id, documentType: 'aadhar', isMandatory: false },

      { approvalTypeId: factoryLicense.id, documentType: 'pan', isMandatory: true },
      { approvalTypeId: factoryLicense.id, documentType: 'gstin_certificate', isMandatory: true },
      { approvalTypeId: factoryLicense.id, documentType: 'land_ownership_proof', isMandatory: true },
      { approvalTypeId: factoryLicense.id, documentType: 'factory_layout_plan', isMandatory: true },
      { approvalTypeId: factoryLicense.id, documentType: 'building_plan_copy', isMandatory: false },

      { approvalTypeId: fireNOC.id, documentType: 'building_plan_copy', isMandatory: true },
      { approvalTypeId: fireNOC.id, documentType: 'fire_safety_layout', isMandatory: true },
      { approvalTypeId: fireNOC.id, documentType: 'noc_previous', isMandatory: false },

      { approvalTypeId: pollutionNOC.id, documentType: 'factory_layout_plan', isMandatory: true },
      { approvalTypeId: pollutionNOC.id, documentType: 'pollution_control_cert', isMandatory: true },
      { approvalTypeId: pollutionNOC.id, documentType: 'water_usage_plan', isMandatory: false },

      { approvalTypeId: electricityConn.id, documentType: 'land_ownership_proof', isMandatory: true },
      { approvalTypeId: electricityConn.id, documentType: 'electricity_bill', isMandatory: false },
      { approvalTypeId: electricityConn.id, documentType: 'pan', isMandatory: true },

      { approvalTypeId: labourReg.id, documentType: 'pan', isMandatory: true },
      { approvalTypeId: labourReg.id, documentType: 'aadhar', isMandatory: true },
      { approvalTypeId: labourReg.id, documentType: 'gstin_certificate', isMandatory: false },
      { approvalTypeId: labourReg.id, documentType: 'labour_license_copy', isMandatory: false },

      { approvalTypeId: waterNOC.id, documentType: 'water_usage_plan', isMandatory: true },
      { approvalTypeId: waterNOC.id, documentType: 'land_ownership_proof', isMandatory: true },
      { approvalTypeId: waterNOC.id, documentType: 'pollution_control_cert', isMandatory: false },

      { approvalTypeId: landAllotment.id, documentType: 'pan', isMandatory: true },
      { approvalTypeId: landAllotment.id, documentType: 'aadhar', isMandatory: true },
      { approvalTypeId: landAllotment.id, documentType: 'incorporation_cert', isMandatory: false },

      { approvalTypeId: shopsReg.id, documentType: 'pan', isMandatory: true },
      { approvalTypeId: shopsReg.id, documentType: 'aadhar', isMandatory: true },
      { approvalTypeId: shopsReg.id, documentType: 'electricity_bill', isMandatory: false },

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
  const in15Days = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000)
  const expired30DaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const in2Years = new Date(now.getTime() + 730 * 24 * 60 * 60 * 1000)

  await prisma.document.createMany({
    data: [
      {
        userId: demoApplicant.id,
        documentType: 'pan',
        fileUrl: '/uploads/demo/pan_card_demo.pdf',
        fileName: 'PAN_Card_ABCDE1234F.pdf',
        expiryDate: null,
      },
      {
        userId: demoApplicant.id,
        documentType: 'gstin_certificate',
        fileUrl: '/uploads/demo/gstin_cert_demo.pdf',
        fileName: 'GSTIN_Certificate.pdf',
        expiryDate: in15Days,
      },
      {
        userId: demoApplicant.id,
        documentType: 'pollution_control_cert',
        fileUrl: '/uploads/demo/pollution_cert_demo.pdf',
        fileName: 'MPCB_Consent_Certificate.pdf',
        expiryDate: expired30DaysAgo,
      },
      {
        userId: demoApplicant.id,
        documentType: 'land_ownership_proof',
        fileUrl: '/uploads/demo/land_deed_demo.pdf',
        fileName: 'Land_Ownership_Deed.pdf',
        expiryDate: in2Years,
      },
    ],
  })
  console.log('✅ Created 4 sample documents in vault')

  // ─── Sample Application with SLA, CIS & Grievance ──────
  const buildingPlanApp = await prisma.application.create({
    data: {
      applicantId: demoApplicant.id,
      approvalTypeId: buildingPlan.id,
      status: 'submitted',
      riskCategory: 'orange',
      assignedOfficerDept: 'municipal_corp',
      slaDays: 30,
      slaDueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    },
  })

  const factoryLicenseApp = await prisma.application.create({
    data: {
      applicantId: demoApplicant.id,
      approvalTypeId: factoryLicense.id,
      status: 'info_requested',
      riskCategory: 'orange',
      assignedOfficerDept: 'dish',
      slaDays: 21,
      slaDueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  })

  await prisma.inspection.create({
    data: {
      applicationId: buildingPlanApp.id,
      scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'scheduled',
      findings: 'Combined inspection for structural safety, environmental compliance and fire exits.',
      officers: {
        create: [
          { officerId: officers[0].id, department: 'fire_dept' },
          { officerId: officers[1].id, department: 'mpcb' },
          { officerId: officers[2].id, department: 'dish' },
        ],
      },
    },
  })
  console.log('✅ Created coordinated joint inspection (CIS) with 3 departments')

  await prisma.grievance.create({
    data: {
      applicationId: factoryLicenseApp.id,
      applicantId: demoApplicant.id,
      tier: 'tier_1_district',
      subject: 'Statutory SLA Breached for Factory License Scrutiny',
      description: 'The prescribed 21-day timeline under RTSA has lapsed. Requesting immediate intervention and deemed approval as per EoDB guidelines.',
      status: 'pending',
    },
  })
  console.log('✅ Created sample grievance with Tier-1 District escalation')

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📋 Demo Accounts:')
  console.log('────────────────────────────────────────')
  officers.forEach(o => {
    console.log(`  Officer: ${o.name} | ${o.email} | Dept: ${o.officerDepartment}`)
  })
  console.log(`  Applicant: ${demoApplicant.name} | ${demoApplicant.email}`)
  console.log('────────────────────────────────────────\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
