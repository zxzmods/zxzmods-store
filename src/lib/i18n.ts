import { COMPANY_CONFIG } from "@/config/company";

export type Language = "es" | "en";

export interface Translations {
  // Brand
  brandName: string;
  tagline: string;
  subTagline: string;
  cfmotoBadge: string;

  // Nav (DJI-inspired minimalist navbar)
  navCfmoto: string;
  navBrands: string;
  navCombos: string;
  navPerformance: string;
  navWorkshop: string;
  navBarrialCr: string;
  navQuote: string;
  navGarage: string;
  navMyVehicle: string;
  navNoVehicle: string;
  navChangeVehicle: string;
  navCart: string;
  navDeliveryQuote: string;
  navUtvPickup: string;
  navHomeService: string;
  navHomeInstallation: string;
  navProfile: string;

  // Authentication & Profile (Firebase Auth & Orders)
  authModalTitle: string;
  authModalSubtitle: string;
  authGoogleButton: string;
  authOrDivider: string;
  authFullNameLabel: string;
  authFullNamePlaceholder: string;
  authFullNameRequired: string;
  authEmailPlaceholder: string;
  authSendCodeButton: string;
  authEnterCode: string;
  authVerifyButton: string;
  authResendCode: string;
  authChangeEmail: string;
  authCodeSentTo: string;
  authInvalidCode: string;
  authSendingCode: string;
  authVerifying: string;
  authPromptReasonTitle: string;
  authGatingGarageReason: string;
  authGatingCartReason: string;
  authGatingServiceReason: string;
  authTermsAgreementPrefix: string;
  authTermsAgreementLink: string;
  authTermsModalTitle: string;
  authTermsAcceptBtn: string;
  termsNavTitle: string;
  termsPageTitle: string;
  termsPageSubtitle: string;
  docsNavTitle: string;
  docsPageTitle: string;
  docsPageSubtitle: string;
  docsSearchPlaceholder: string;
  docsIndexTitle: string;
  docsOfficialStamp: string;
  docsNoResults: string;
  docsPrintBtn: string;
  docsShareBtn: string;
  docsShareCopied: string;
  docsExecutiveSummary: string;
  docsLegalFramework: string;
  docsContactAdvisor: string;
  docsUnderstoodClose: string;
  profileTitle: string;
  profileOrdersTab: string;
  profileInfoTab: string;
  profileNoOrders: string;
  profileNoOrdersDesc: string;
  profileExploreParts: string;
  profileLogout: string;
  profileLoggedInAs: string;
  profileVehicles: string;
  profileFullName: string;
  profileNamePlaceholder: string;
  profileNoNameSet: string;
  profileActiveCart: string;
  profileViewCart: string;
  profileCartOrderInProgress: string;
  profileEmail: string;
  profilePhone: string;
  profilePhonePlaceholder: string;
  profileSave: string;
  profileSaving: string;
  profileSavedSuccess: string;
  orderNumberLabel: string;
  orderDateLabel: string;
  orderStatusLabel: string;
  orderTotalLabel: string;
  orderItemsLabel: string;
  ordersPageTitle: string;
  ordersPageSubtitle: string;
  ordersSearchPlaceholder: string;
  ordersAuthRequiredTitle: string;
  ordersAuthRequiredSubtitle: string;
  ordersSignInBtn: string;
  ordersContactWhatsApp: string;
  ordersDeliveryService: string;
  ordersItemsLabel: string;
  ordersSummaryLabel: string;
  ordersRedirectBtn: string;
  ordersViewTracking: string;

  // Scheduled Services Screen (User requirement)
  scheduledServicesTitle: string;
  scheduledServicesSubtitle: string;
  scheduledServicesNoItems: string;
  scheduledServicesNoItemsDesc: string;
  scheduledServicesBookBtn: string;
  scheduledServicesAuthRequired: string;
  scheduledServicesAuthDesc: string;
  scheduledServicesBadgeCanEdit: string;
  scheduledServicesBadgeLocked: string;
  scheduledServicesHoursRemaining: string;
  scheduledServicesHoursToDelivery: string;
  scheduledServicesLockedNotice: string;
  scheduledServicesCanEditNotice: string;
  scheduledServicesEditDateTime: string;
  scheduledServicesModalTitle: string;
  scheduledServicesSelectDate: string;
  scheduledServicesSelectTime: string;
  scheduledServicesSaveSchedule: string;
  scheduledServicesCommentsTitle: string;
  scheduledServicesCommentsSubtitle: string;
  scheduledServicesAddCommentPlaceholder: string;
  scheduledServicesPostComment: string;
  scheduledServicesCommentPosted: string;
  scheduledServicesRescheduleSuccess: string;
  scheduledServicesRescheduleError48h: string;
  scheduledServicesDrawerButton: string;
  scheduledServicesDrawerView: string;
  scheduledServicesAppointmentCode: string;
  scheduledServicesServiceTypeLabel: string;
  scheduledServicesDestinationLabel: string;
  scheduledServicesWorkshopAddressLabel: string;
  scheduledServicesLinkedOrderLabel: string;

  // Quotation & Order Details
  orderStatusCotizacion: string;
  orderCotizacionExpiresNote: string;
  orderCotizacionStaffNotice: string;
  orderCotizacionEmptyNotice: string;
  orderDetailsTitle: string;
  orderDetailsSubtitle: string;
  orderDownloadReceipt: string;
  orderReceiptTitle: string;
  orderReceiptSubtitle: string;
  orderReceiptPrintBtn: string;
  orderReceiptBackToOrder: string;
  orderReceiptSoldBy: string;
  orderReceiptBilledTo: string;
  orderReceiptPaymentMethod: string;
  orderReceiptPaymentRef: string;
  orderReceiptDeliveryMethod: string;
  orderReceiptTermsTitle: string;
  orderReceiptWarrantyTerms: string;
  orderReceiptDeliveryTerms: string;
  orderReceiptSupportNotice: string;
  orderReceiptOfficialProof: string;
  orderProductsList: string;
  orderProceedToPay: string;
  orderScheduleServiceBtn: string;
  orderRescheduleServiceBtn: string;
  orderScheduleServiceBannerTitle: string;
  orderScheduleServiceBannerSubtitle: string;
  orderScheduleServicePrompt: string;
  orderPayModalTitle: string;
  orderPayModalSubtitle: string;
  orderSinpeTitle: string;
  orderSinpeDesc: string;
  orderBankTransferTitle: string;
  orderBankTransferDesc: string;
  orderPaymentReferenceLabel: string;
  orderPaymentPhoneLabel: string;
  orderPaymentConfirmBtn: string;
  orderPaymentSuccessMsg: string;
  orderCommentsTitle: string;
  orderCommentsSubtitle: string;
  orderCommentPlaceholder: string;
  orderCommentSubmit: string;
  orderCommentResetsTimer: string;
  orderActiveQuoteBanner: string;
  orderViewDetailsBtn: string;
  orderPrintProforma: string;
  orderBackToOrders: string;
  orderPaidCurrencyBadge: string;
  orderPaidInCRC: string;
  orderPaidInUSD: string;
  orderPayModalCurrencyLabel: string;
  orderPayModalFixTitle: string;
  orderPayModalFixSubtitle: string;
  orderPayModalFixSubmitBtn: string;
  orderPayModalFixDropzonePrompt: string;
  orderUploadProofModalTitle: string;
  orderUploadProofModalSubtitle: string;
  orderUploadProofDropzonePrompt: string;
  orderUploadProofSubmitBtn: string;
  orderUploadProofSuccessMsg: string;
  orderAttachProofStaffBtn: string;
  orderApprovePaymentStaffBtn: string;
  devInstallDurationLabel: string;
  devInstallDurationHelp: string;
  orderInstallationDurationTitle: string;
  orderInstallationDurationHoursLabel: string;
  orderSaveInstallationDurationBtn: string;
  orderInstallationDurationSavedSuccess: string;
  backdoorAgendaMaxInstallsTitle: string;
  backdoorAgendaMaxInstallsBadge: string;
  backdoorAgendaMaxInstallsSetting: string;
  backdoorAgendaMaxInstallsSaved: string;
  serviceCollisionCapacityReached: string;
  serviceEstimatedInstallationBadge: string;
  serviceEstimatedInstallationDesc: string;
  serviceCarryoverNextDayBadge: string;
  backdoorAgendaDrivingTime: string;
  backdoorAdjustTimeModalTitle: string;
  backdoorAdjustTimeSheet: string;
  backdoorAdjustDurationLabel: string;
  backdoorAdjustSaveBtn: string;
  backdoorMasterOnlyCapacity: string;

  // Order Notification Alerts
  orderAlertAdvancedTitle: string;
  orderAlertUpdatedTitle: string;
  orderAlertAdvancedDesc: string;
  orderAlertUpdatedDesc: string;
  orderAlertRejectedTitle: string;
  orderAlertRejectedDesc: string;
  orderAlertFixPaymentBtn: string;
  orderAlertViewOrderBtn: string;
  orderAlertDismissBtn: string;
  orderAlertProgramServiceTitle: string;
  orderAlertProgramServiceDesc: string;
  orderAlertProgramServiceBtn: string;

  // Notification Banner
  bannerTitle: string;
  bannerTitleShort: string;
  bannerAction: string;
  bannerActionShort: string;
  bannerDismiss: string;

  // Hero Section (DJI RS 5 Style)
  heroCategory: string;
  heroTitle: string;
  heroSubtitle: string;
  heroLearnMore: string;
  heroBuyNow: string;
  heroQuoteBtn: string;
  videoPlaceholderNote: string;
  heroBadge: string;
  heroHighlight: string;
  heroDescription: string;
  heroExploreBtn: string;
  heroWhatsAppBtn: string;
  heroMetric1Label: string;
  heroMetric1Value: string;
  heroMetric2Label: string;
  heroMetric2Value: string;
  heroMetric3Label: string;
  heroMetric3Value: string;

  // Brands Grid (DJI 2-Column Showcase Style)
  brandsTitle: string;
  brandsSubtitle: string;
  brandsViewModels: string;
  brandsSectionTitle: string;
  brandsSectionSubtitle: string;
  cfmotoSpecialityNote: string;
  exploreModels: string;
  quoteThisBrand: string;
  dealerBrandsAriaLabel: string;
  dealerBrandsTooltip: string;

  // Combos
  combosTitle: string;
  combosSubtitle: string;
  combosIncludes: string;
  comboInstallAddon: string;
  comboAddToCart: string;
  comboOriginalPrice: string;
  comboDiscountBadge: string;
  combosSearchPlaceholder: string;
  combosAllCategories: string;
  combosCategoryPerformance: string;
  combosCategoryRings: string;
  combosCategoryLights: string;
  combosNoResults: string;
  combosActiveVehicleNotice: string;
  combosChangeVehicle: string;
  combosSelectVehicle: string;
  combosIncludesSummary: string;
  comboViewDetails: string;
  comboBreadcrumb: string;
  comboNotFound: string;
  comboNotFoundDesc: string;
  comboBackToCombos: string;
  comboRelatedTitle: string;
  comboRelatedSubtitle: string;
  comboSavings: string;
  comboFitmentVerified: string;
  comboFitmentPrompt: string;

  // Performance
  performanceTitle: string;
  performanceSubtitle: string;
  stageBadge: string;
  stageHpGain: string;
  stageTorqueGain: string;
  stageDynoIncluded: string;
  stageSelectBtn: string;

  // Separate Screens CTAs
  viewCombosBtn: string;
  viewPerformanceBtn: string;
  requestQuoteTitle: string;
  requestQuoteSubtitle: string;

  // Fitment & Garage Modal
  garageModalTitle: string;
  garageModalSubtitle: string;
  garageSelectYear: string;
  garageSelectBrand: string;
  garageSelectModel: string;
  garageSaveBtn: string;
  garageCancelBtn: string;
  garageFirstTimeNotice: string;
  garageFitSuccess: string;
  garageFitWarning: string;

  // Garage Fleet Screen & Videogame Configurator
  garageFleetTitle: string;
  garageFleetSubtitle: string;
  garageRegisteredCounter: string;
  garageMaxNotice: string;
  garageRegisterNewBtn: string;
  garageActiveBadge: string;
  garageSetActiveBtn: string;
  garageActiveStatus: string;
  garageDeleteBtn: string;
  garageDeleteConfirm: string;
  garageEmptyTitle: string;
  garageEmptySubtitle: string;
  garageEmptyCta: string;
  garageViewCompatibleParts: string;
  garageManageBreadcrumb: string;
  garageRegisterBreadcrumb: string;
  garageSlotsAvailable: string;
  garageSlotFull: string;
  garageYearLabel: string;
  garageBrandLabel: string;
  garageModelLabel: string;
  garageCategoryLabel: string;
  garageNicknameField: string;
  garageNicknamePlaceholder: string;
  garageColorField: string;
  garageColorPlaceholder: string;
  garageNotesField: string;
  garageNotesPlaceholder: string;
  garageRegisterSuccessMsg: string;
  garageRegisterErrorLimit: string;
  garageVideogameStageTitle: string;
  garageVideogameStageSubtitle: string;
  garageVideogameSelectPrompt: string;
  garageVideogameBrandFallbackBadge: string;
  garageSaveVehicleCta: string;
  garageCancelVehicleCta: string;
  garageBackToFleetCta: string;
  garageTelemetrySpecs: string;
  garageDeleteSuccess: string;
  garageRegisterTitle: string;
  garageRegisterSubtitle: string;
  garageSelectPlaceholder: string;
  garageBrandLogoSelectPrompt: string;

  // Workshop & Warranties (Updated to 60 days mechanical)
  workshopTitle: string;
  workshopSubtitle: string;
  workshopAddressLabel: string;
  workshopHoursLabel: string;
  workshopPhoneLabel: string;
  workshopWhatsAppLabel: string;
  workshopOpenMaps: string;
  workshopCall: string;
  locationBadge: string;
  locationTitle: string;
  locationSubtitle: string;
  locationGoogleMapsBtn: string;
  locationWazeBtn: string;
  locationCopyAddress: string;
  locationAddressCopied: string;
  locationBreadcrumb: string;
  warrantySectionTitle: string;
  warrantySectionSubtitle: string;
  warrantyBoltOnTitle: string;
  warrantyBoltOnTerm: string;
  warrantyBoltOnDesc: string;
  warrantyMechTitle: string;
  warrantyMechTerm: string;
  warrantyMechDesc: string;
  warrantyEcuTitle: string;
  warrantyEcuTerm: string;
  warrantyEcuDesc: string;
  warrantyProductTitle: string;
  warrantyProductTerm: string;
  warrantyProductDesc: string;
  installationDiscountBanner: string;

  // Cart & Floating Concierge
  cartTitle: string;
  cartEmpty: string;
  cartTotal: string;
  cartPartsSubtotal: string;
  cartLaborSubtotal: string;
  cartLaborDiscount: string;
  cartCheckout: string;
  cartPayWithCreditCard: string;
  cartPayWithCreditCardBac: string;
  cartPayWithCreditCardDesc: string;
  cartPayWithTransfer: string;
  cartTransferSubtitle: string;
  cartBacCompraClickNotice: string;
  cartBacCompraClickGenerating: string;
  orderBacCompraClickBadge: string;
  orderBacCompraClickRequestedNotice: string;
  orderBacMoveToPaymentConfirmation: string;
  orderBacConfirmPaymentPrompt: string;
  cartItemInstalled: string;
  cartItemPartsOnly: string;
  cartViewFull: string;
  cartCurrencyLabel: string;
  cartCurrencyCRC: string;
  cartCurrencyUSD: string;
  cartLiveRateLabel: string;
  cartLiveRateOfficial: string;
  cartProductAddedTitle: string;
  cartProductAddedSubtitle: string;
  cartContinueShopping: string;
  cartClearAll: string;
  cartClearConfirm: string;
  cartOrderSummary: string;
  cartVehicleCompatibilityTitle: string;
  cartDiscountPerkActive: string;
  cartDiscountPerkPrompt: string;
  cartUnitPrice: string;
  cartQuantity: string;
  cartInstallation: string;
  cartSubtotal: string;
  cartActions: string;
  cartEstimatedTotal: string;
  cartWorkshopPerk: string;
  cartWarrantyPerk: string;
  cartShippingPerk: string;
  cartProductBrandLabel: string;
  cartCompatibleModelsLabel: string;
  cartCompatibleWithGarage: string;
  cartNotVerifiedForGarage: string;
  cartGarageAdvicePrompt: string;
  cartGarageAdviceBtn: string;
  whatsappConciergePrompt: string;
  whatsappQuoteTitle: string;
  cartQuoteViaWhatsapp: string;
  cartRemoveConfirmTitle: string;
  cartRemoveConfirmMessage: string;
  cartRemoveConfirmAction: string;
  cartRemoveConfirmCancel: string;
  productInCart: string;
  cartHomeInstallationEligible: string;
  cartHomeInstallationIneligible: string;
  cartHomeInstallationCheckoutTitle: string;
  cartHomeInstallationCheckoutDesc: string;
  cartHomeInstallationCheckoutBadge: string;
  cartItemFreeInstallation: string;
  cartFree: string;
  cartItemPaidInServices: string;
  cartItemPaidInServicesCheckout: string;
  checkoutTitle: string;
  checkoutSubtitle: string;
  checkoutPaymentProcedure: string;
  checkoutPaymentProcedureDesc: string;
  checkoutAccountsTitle: string;
  checkoutUploadTitle: string;
  checkoutUploadDesc: string;
  checkoutTermsLabel: string;
  checkoutConfirmBtn: string;
  checkoutConfirmingBtn: string;
  checkoutAlertExit: string;
  checkoutTermsModalTitle: string;
  checkoutTermsModalContent: string;
  checkoutPhoneLabel: string;
  checkoutPhonePlaceholder: string;
  checkoutPhoneDesc: string;

  // Factura Electrónica & Order Discounts
  orderDiscountApplied: string;
  orderFacturaTaxLabel: string;
  orderFacturaDetailsTitle: string;
  orderFacturaCompany: string;
  orderFacturaId: string;
  orderFacturaEmail: string;
  orderFacturaPhone: string;
  orderFacturaEconomicActivity: string;
  orderFacturaNotes: string;
  checkoutFacturaToggle: string;
  checkoutFacturaSubtitle: string;
  checkoutFacturaCompanyLabel: string;
  checkoutFacturaCompanyPlaceholder: string;
  checkoutFacturaIdTypeLabel: string;
  checkoutFacturaIdTypeJuridica: string;
  checkoutFacturaIdTypeFisica: string;
  checkoutFacturaIdTypeDimex: string;
  checkoutFacturaIdTypeNite: string;
  checkoutFacturaIdNumberLabel: string;
  checkoutFacturaIdNumberPlaceholder: string;
  checkoutFacturaEmailLabel: string;
  checkoutFacturaEmailPlaceholder: string;
  checkoutFacturaPhoneLabel: string;
  checkoutFacturaPhonePlaceholder: string;
  checkoutFacturaEconomicActivityLabel: string;
  checkoutFacturaEconomicActivityPlaceholder: string;
  checkoutFacturaDetailsLabel: string;
  checkoutFacturaDetailsPlaceholder: string;
  checkoutFacturaTaxBadge: string;
  checkoutFacturaRequiredError: string;
  checkoutFacturaSamePhoneError: string;

  // Add-To-Cart Recommendations Modal
  cartAddedModalTitle: string;
  cartAddedModalFrequentlyBought: string;
  cartAddedModalFrequentlyBoughtDesc: string;
  cartAddedModalAddToCart: string;
  cartAddedModalAdded: string;
  cartAddedModalViewCart: string;
  cartAddedModalCheckout: string;
  cartAddedModalContinue: string;

  // Smart Pre-Checkout Optimizer
  smartCheckoutModalTitle: string;
  smartCheckoutModalSubtitle: string;
  smartCheckoutComboBadge: string;
  smartCheckoutComboSwapBtn: string;
  smartCheckoutComboSwappedSuccess: string;
  smartCheckoutCurrentParts: string;
  smartCheckoutComboPrice: string;
  smartCheckoutYouSave: string;
  smartCheckoutRelatedTitle: string;
  smartCheckoutRelatedDesc: string;
  smartCheckoutContinueBtn: string;
  smartCheckoutSkipBtn: string;
  smartCheckoutBannerNotice: string;
  smartCheckoutBannerAction: string;

  // Skeletons & Status
  loadingCatalog: string;
  loadingVehicleData: string;
  systemBoot: string;
  enterSite: string;
  skipIntro: string;
  scrollDown: string;

  // Products & Search
  productsTitle: string;
  productsSubtitle: string;
  productsSearchPlaceholder: string;
  productsAllCategories: string;
  productsAllBrands: string;
  productsAllVehicles: string;
  productsFilterCategory: string;
  productsFilterBrand: string;
  productsFilterVehicleBrand: string;
  productsAllVehicleBrands: string;
  productsFilterModelCategory: string;
  productsAllModelCategories: string;
  productsBrandCategoriesHeading: string;
  productsModelsInCategory: string;
  productsFilterDistributorBrand: string;
  productsAllDistributorBrands: string;
  productsFilterInStock: string;
  productsFilterDiscounted: string;
  productsFilterCompatibility: string;
  productsFitMyGarage: string;
  productsSortBy: string;
  productsSortRelevant: string;
  productsSortPriceAsc: string;
  productsSortPriceDesc: string;
  productsSortRating: string;
  productsPricePiece: string;
  productsPriceIncludesIva: string;
  productsPriceWithIvaFull: string;
  checkoutPricesIncludeIvaNotice: string;
  devProductIvaTitle: string;
  devProductIvaHelp: string;
  productsInstallationFree: string;
  productsInstallationAddon: string;
  productsCurrencyCheckoutNote: string;
  productsRequirementsNotice: string;
  productsUniversalFit: string;
  productsFitsSxs: string;
  productsAddToCart: string;
  productsQuoteWhatsapp: string;
  productsNoResults: string;
  productsNoResultsDesc: string;
  productsClearFilters: string;
  productsCount: string;
  productAudioSample: string;
  productVideoSample: string;
  productListenAudio: string;
  productAudioIdle: string;
  productAudioRev: string;
  productAudioSelectTrack: string;
  productAudioErrorNotice: string;
  productNoReviews: string;
  productFitCheckTitle: string;
  productFitCheckCompatible: string;
  productFitCheckIncompatible: string;
  productFitCheckDirectFit: string;
  productFitCheckPlatformNote: string;
  productFitCheckNoVehicle: string;
  productFitCheckConfigureBtn: string;
  productFitCheckChangeBtn: string;
  productRequirementsShelfTitle: string;
  productRequirementsShelfSubtitle: string;
  productRelatedShelfTitle: string;
  productRelatedShelfSubtitle: string;
  productModelYearCompatTitle: string;
  productModelYearCompatSubtitle: string;
  productMake: string;
  productModel: string;
  productYears: string;
  productTrim: string;
  productFitmentType: string;
  productFitmentNotes: string;
  productVehicleMatches: string;
  productVehicleAutoSelected: string;
  productUniversalModelYear: string;
  productViewYearFitment: string;

  // US Supplier Availability Projection
  supplierStockInStock: string;
  supplierStockPreOrder: string;
  supplierStockLowStock: string;
  supplierStockOutOfStock: string;
  supplierStockUnavailable: string;
  supplierVerifiedBadge: string;
  supplierLeadTimeText: string;
  supplierPreOrderNotice: string;
  supplierReserveQuotationBtn: string;
  supplierReserveQuotationNotice: string;

  // Customer Verified Reviews System
  reviewsSectionTitle: string;
  reviewsSectionSubtitle: string;
  reviewsVerifiedBuyerBadge: string;
  reviewsVerifiedBuyerNotice: string;
  reviewsCompletedOrderOnlyNotice: string;
  reviewsWriteReviewBtn: string;
  reviewsEditReviewBtn: string;
  reviewsFormTitle: string;
  reviewsFormEditTitle: string;
  reviewsRatingLabel: string;
  reviewsTitleLabel: string;
  reviewsTitlePlaceholder: string;
  reviewsCommentLabel: string;
  reviewsCommentPlaceholder: string;
  reviewsSubmitBtn: string;
  reviewsSaveEditBtn: string;
  reviewsCancelBtn: string;
  reviewsSubmitting: string;
  reviewsSuccessToast: string;
  reviewsErrorToast: string;
  reviewsEmptyList: string;
  reviewsLoginPrompt: string;
  reviewsRatingOutOfFive: string;
  reviewsAverageRating: string;
  reviewsBasedOn: string;
  reviewsFilterAll: string;
  reviewsMyReviewBadge: string;
  orderLeaveReviewBtn: string;
  orderEditReviewBtn: string;
  supplierCartPreOrderChip: string;
  supplierCartInStockChip: string;
  supplierCartOutOfStockChip: string;
  supplierCartOutOfStockWarning: string;
  supplierLastCheckedLabel: string;
  supplierCheckingLive: string;

  // Backdoor / Stealth Dev-Console
  devConsoleTitle: string;
  devConsoleSubtitle: string;
  devRoleMaster: string;
  devRoleStaff: string;
  devCostShipping: string;
  devCostInstallation: string;
  devCostPickup: string;
  devCostParts: string;
  devOrderProgression: string;
  devStatusPending: string;
  devStatusPartsOrdered: string;
  devStatusInTransit: string;
  devStatusReadyForInstall: string;
  devStatusInProgress: string;
  devStatusCompleted: string;
  devStatusCancelled: string;
  devDiscountAdd: string;
  devDiscountPercentage: string;
  devDiscountFixed: string;
  devDiscountReason: string;
  devBasePriceLocked: string;
  devInstallationCostEditable: string;
  devAuditHistory: string;
  devAuditActor: string;
  devAuditAction: string;
  devAuditTimestamp: string;
  devAuditOldValue: string;
  devAuditNewValue: string;
  devAuthEmail: string;
  devAuthPasskey: string;
  devAuthLoginBtn: string;
  devAuthAuthenticating: string;
  devAuthLogoutBtn: string;
  devAuthTerminalLocked: string;
  devAuthSessionActive: string;
  devAuthSecuredConnection: string;
  devOrdersTitle: string;
  devCreateOrderTitle: string;
  devCatalogTitle: string;
  devAuditTitle: string;
  devStaffTitle: string;
  devSearchPlaceholder: string;
  devFilterAll: string;
  devNoOrders: string;
  devSaveSuccess: string;
  devSaveError: string;
  devCreateProductBtn: string;
  devCreateComboBtn: string;
  devCreateStaffBtn: string;
  devUploadImage: string;
  devUploading: string;
  devSelectCustomer: string;
  devGuestCustomer: string;
  devDeliveryType: string;
  devHomeInstallation: string;
  devStorePickup: string;
  devShippingCR: string;
  devDiscountLimitAlert: string;
  orderStatusPaymentConfirmation: string;
  orderDeleteBtn: string;
  orderDeleteQuoteConfirmTitle: string;
  orderDeleteQuoteConfirmPrompt: string;
  orderDeleteMasterPasswordRequired: string;
  orderMasterPasswordLabel: string;
  orderMasterPasswordPlaceholder: string;
  orderDeleteSuccessMsg: string;
  orderEditQuoteTitle: string;
  orderManageTitle: string;
  orderHasNotesBadge: string;
  orderImportantNotesLabel: string;
  orderAddNoteBtn: string;
  orderSelectTransportService: string;
  orderTransportStorePickup: string;
  orderTransportHomeService: string;
  orderTransportUtvPickup: string;
  orderTransportShipping: string;
  devYearFromLabel: string;
  devYearToLabel: string;
  devYearRangeTitle: string;
  devUploadVideoBtn: string;
  devUploadAudioBtn: string;
  devMediaUploadSection: string;
  comboInstallationIncluded: string;
  comboInstallationBadge: string;
  productEliminateBtn: string;
  productEliminateConfirmTitle: string;
  productEliminateConfirmPrompt: string;
  productEliminateSuccess: string;
  productArchiveBtn: string;
  productUnarchiveBtn: string;
  productArchiveConfirmPrompt: string;
  productUnarchiveConfirmPrompt: string;
  productFilterAll: string;
  productFilterActive: string;
  productFilterArchived: string;
  productFindArchivedBtn: string;
  comboEliminateBtn: string;
  comboEliminateConfirmTitle: string;
  comboEliminateConfirmPrompt: string;
  comboEliminateSuccess: string;
  comboArchiveBtn: string;
  comboUnarchiveBtn: string;
  comboArchiveConfirmPrompt: string;
  comboUnarchiveConfirmPrompt: string;
  comboFilterAll: string;
  comboFilterActive: string;
  comboFilterArchived: string;
  comboFindArchivedBtn: string;
  orderPaymentProofTitle: string;
  orderPaymentProofBadge: string;
  orderNoPaymentProofBadge: string;
  orderViewPaymentProofBtn: string;
  orderUploadPaymentProofBtn: string;
  orderPaymentProofModalTitle: string;
  orderPaymentProofModalSubtitle: string;
  orderPaymentProofEmpty: string;
  orderPaymentProofVerified: string;
  orderPaymentProofOpenFull: string;
  orderPaymentProofNewTab: string;
  orderPaymentProofCurrencyLabel: string;
  orderPaymentProofAttachStaffBtn: string;
  orderServicePaymentProofTitle: string;
  orderServicePaymentProofSubtitle: string;
  orderInstallationPaymentProofTitle: string;
  orderInstallationPaymentProofSubtitle: string;
  orderPickupClientNotice: string;
  orderStaffManagedNotice: string;
  orderAttachServiceProofBtn: string;
  orderAttachInstallationProofBtn: string;
  orderInspectProofBtn: string;
  orderDiscountTitle: string;

  orderDiscountTypePercent: string;
  orderDiscountTypeAmount: string;
  orderDiscountMasterPasswordReq: string;
  orderConfigureTransportBtn: string;
  orderTransportConfigModalTitle: string;
  orderStatusNeedToGetOrder: string;
  orderStatusShippingInUs: string;
  orderStatusShippingToCr: string;
  orderStatusInCostaRica: string;
  orderStatusInWarehouseCheck: string;
  orderStatusReadyToPickUp: string;
  orderStatusProgramService: string;
  orderStatusWaitingOnDelivery: string;
  orderStatusPickupDateSet: string;
  orderStatusInstalling: string;
  orderStatusReadyToSetReturnDate: string;
  orderStatusHomeInstallSet: string;
  orderStatusReadyForPickup: string;
  orderStatusCompleted: string;
  orderStatusPaymentRejected: string;
  orderRejectedPaymentCorrectedBadge: string;
  orderRejectedCorrectedStaffBannerTitle: string;
  orderRejectedCorrectedStaffBannerDesc: string;
  orderRejectedCorrectedCustomerTitle: string;
  orderRejectedCorrectedCustomerNotice: string;
  emailSubjectOrderPaymentConfirmed: string;
  emailSubjectServicePaymentConfirmed: string;
  emailSubjectInstallationPaymentConfirmed: string;
  emailSubjectPaymentRejected: string;
  emailSubjectProgramService: string;
  emailSubjectReadyForPickup: string;
  emailSubjectPickupDateSet: string;
  emailSubjectOrderCompleted: string;
  emailSubjectInstallationPayment: string;
  emailGoogleReviewPrompt: string;
  emailGoogleReviewButton: string;
  emailViewOrderButton: string;
  emailScheduleServiceButton: string;
  emailPayInstallationButton: string;
  emailUploadNewReceiptButton: string;
  orderRejectPaymentBtn: string;
  orderRejectServicePaymentBtn: string;
  orderRejectInstallPaymentBtn: string;
  orderRejectServiceModalTitle: string;
  orderRejectInstallModalTitle: string;
  orderAdvanceStageBtn: string;
  orderRejectModalTitle: string;
  orderRejectReasonPrompt: string;
  orderRejectReasonPlaceholder: string;
  orderRejectConfirmBtn: string;
  orderRejectedCustomerAlert: string;
  orderRejectedCustomerAdvice: string;
  orderReuploadProofBtn: string;
  orderConfigureReturnDelivery: string;
  orderHalfRateDeliveryBadge: string;
  orderHalfRateDeliveryDesc: string;
  orderConfirmStatusTitle: string;
  orderConfirmStatusPrompt: string;
  orderConfirmBtn: string;
  orderCancelBtn: string;
  devProductEditMode: string;
  devProductEditModeDesc: string;
  devBackToCatalog: string;
  devSaveChanges: string;
  devSaving: string;
  devComboEditTitle: string;
  devComboCreateTitle: string;
  devComboEditScreenTitle: string;
  devComboCreateScreenTitle: string;
  devComboIncludedProducts: string;
  devComboSearchProductPlaceholder: string;
  devComboAddProduct: string;
  devComboEditProductLink: string;
  devComboNoProductsSelected: string;
  devComboUniqueProductTitle: string;
  devComboUniqueProductDesc: string;
  devComboUniqueProductEnableToggle: string;
  devComboUniqueProductTemplates: string;
  devComboUniqueProductTemplateSuspension: string;
  devComboUniqueProductTemplateECU: string;
  devComboUniqueProductTemplateCustom: string;
  devComboUniqueProductNameEs: string;
  devComboUniqueProductNameEn: string;
  devComboUniqueProductBadgeEs: string;
  devComboUniqueProductBadgeEn: string;
  devComboUniqueProductDescEs: string;
  devComboUniqueProductDescEn: string;
  devComboUniqueProductPrice: string;
  devComboUniqueProductImage: string;
  devComboUniqueProductUploadImage: string;
  devComboUniqueProductFieldsTitle: string;
  devComboUniqueProductFieldsSubtitle: string;
  devComboUniqueProductAddField: string;
  devComboUniqueProductFieldName: string;
  devComboUniqueProductFieldType: string;
  devComboUniqueProductFieldTypeText: string;
  devComboUniqueProductFieldTypeNumber: string;
  devComboUniqueProductFieldTypeSelect: string;
  devComboUniqueProductFieldOptionsPrompt: string;
  devComboUniqueProductFieldRequired: string;
  devComboUniqueProductQuickCreateProduct: string;
  devComboUniqueProductQuickCreateModalTitle: string;
  devComboUniqueProductQuickCreateSuccess: string;
  comboUniqueProductBadgeDefault: string;
  comboUniqueProductCustomizationTitle: string;
  comboUniqueProductCustomizationSubtitle: string;
  comboUniqueProductRequiredMissing: string;
  devComboAvailabilityCol: string;
  devComboAvailabilityLiveTitle: string;
  devComboAvailabilityNotice: string;
  devComboStockInStock: string;
  devComboStockPreOrder: string;
  devComboStockLowStock: string;
  devComboStockOutOfStock: string;
  devComboStockUnavailable: string;
  devComboMissingComponentsWarning: string;
  devComboAllComponentsReady: string;
  comboOutOfStockAlertTitle: string;
  comboOutOfStockAlertDesc: string;
  comboComponentInStock: string;
  comboComponentPreOrder: string;
  comboComponentOutOfStock: string;
  comboComponentArchived: string;
  comboQuoteBecauseOutOfStock: string;
  devItemsIncluded: string;
  devOriginalPrice: string;
  devDiscountPercent: string;
  devBadgeLabel: string;
  devCombosListTitle: string;
  devProductsListTitle: string;
  devStockStatus: string;
  devBaseHardwarePrice: string;
  devLaborInstallCost: string;
  devInstallLabourCostLabel: string;
  devInstallExtraPartsLabel: string;
  devInstallExtraPartsAddBtn: string;
  devInstallExtraPartsNamePlaceholder: string;
  devInstallExtraPartsPricePlaceholder: string;
  devInstallExtraPartsEmpty: string;
  devInstallExtraPartsTotal: string;
  devInstallProfitLabel: string;
  devInstallTotalCostLabel: string;
  devInstallBreakdownHelp: string;
  devComboAddProductInstallCostsBtn: string;
  devComboProductsInstallSummary: string;
  devStaffInstallEditable: string;
  devMasterPriceOnly: string;
  devFreeInstallationCheckbox: string;
  devFreeInstallationHelp: string;
  devFreeInstallationBadge: string;
  devCompLabel: string;
  devCategoryLabel: string;
  devBrandLabel: string;
  devAutoGenerateSkuBtn: string;
  devSkuPatternHelp: string;
  devPriceBreakdownTitle: string;
  devPriceProcessingUSD: string;
  devPriceProcessingCRC: string;
  devPriceShippingCRC: string;
  devPriceLaborCRC: string;
  devPriceProfitCRC: string;
  devPriceTotalCRC: string;
  devPriceTotalUSD: string;
  devPriceDollarNotice: string;
  devAutoCalculatePrice: string;
  devImagesListLabel: string;
  devVideosListLabel: string;
  devAudiosListLabel: string;
  devProductTitleLabel: string;
  devRequirementsLabel: string;
  devReviewsLabel: string;
  devInHomeInstallLabel: string;
  devYearCompatLabel: string;
  devAudioPreview: string;
  devSpecsAndDesc: string;
  devCompatibilityList: string;
  devHomeInstallEligible: string;
  devCompVehiclesLabel: string;
  devAddVehicleSelector: string;
  devSelectVehiclePrompt: string;
  devRemoveVehicle: string;
  devUniversalFitment: string;
  devCategorySelectorLabel: string;
  devSelectCategoryPrompt: string;
  devAddCategoryBtn: string;
  devNewCategoryBtn: string;
  devComboCategoryLabel: string;
  devAddCategoryModalTitle: string;
  devAddCategoryModalDesc: string;
  devCategoryNameEsLabel: string;
  devCategoryNameEnLabel: string;
  devCategoryCreatedSuccess: string;
  devCategoryCreateError: string;
  devCategoryCapsNotice: string;

  // Configurable Parameters & Variants
  productParametersTitle: string;
  productParametersDesc: string;
  productParameterOptionSelect: string;
  productParameterPriceModifier: string;
  productParameterIncluded: string;
  devParametersTitle: string;
  devParametersDesc: string;
  devAddParameterBtn: string;
  devRemoveParameterBtn: string;
  devParameterNameEsLabel: string;
  devParameterNameEnLabel: string;
  devParameterOptionsTitle: string;
  devAddOptionBtn: string;
  devRemoveOptionBtn: string;
  devOptionLabelEs: string;
  devOptionLabelEn: string;
  devOptionPriceDelta: string;
  devOptionPriceDeltaHelp: string;
  devNoParametersNotice: string;
  devAddColorPresetBtn: string;
  devOptionColorLabel: string;
  devOptionImageLabel: string;
  devOptionImageUpload: string;
  devOptionNoColor: string;
  devOptionSupplierUrlLabel: string;
  devAddProductLinkingPresetBtn: string;
  devParameterTypeLabel: string;
  devParamTypeButton: string;
  devParamTypeColor: string;
  devParamTypeProductLinking: string;
  devSelectLinkedProduct: string;
  devLinkedProductBadge: string;
  devLinkedProductDesc: string;
  productLinkedUpgradesTitle: string;

  // Pick-up, Delivery & Home Installation
  servicesTitle: string;
  servicesSubtitle: string;
  serviceTabPickup: string;
  serviceTabDelivery: string;
  serviceTabInstallation: string;
  serviceTabShopInstallation: string;
  servicePickupDesc: string;
  servicePickupRoundTripNotice: string;
  servicePickupRoundTripBadge: string;
  // Pick-up vehicle compatibility specifications (LE-01)
  pickupCompatTitle: string;
  pickupCompatSubtitle: string;
  pickupCompatCategory: string;
  pickupCompatCategoryVal: string;
  pickupCompatMaxWidth: string;
  pickupCompatMaxWidthVal: string;
  pickupCompatMaxLength: string;
  pickupCompatMaxLengthVal: string;
  pickupCompatMaxWeight: string;
  pickupCompatMaxWeightVal: string;
  pickupCompatMaxHeight: string;
  pickupCompatMaxHeightVal: string;
  pickupCompatCondition: string;
  pickupCompatConditionVal: string;
  pickupCompatNote: string;

  // Delivery Window & Estimates (LE-02)
  deliveryWindowBanner: string;
  deliveryWindowDisclaimer: string;

  // Suggested Combos & Products (LE-03)
  productSuggestedCombosTitle: string;
  productSuggestedCombosSubtitle: string;
  productSuggestedProductsTitle: string;
  productSuggestedProductsSubtitle: string;
  productViewComboBtn: string;
  productViewProductBtn: string;
  productSuggestedEmpty: string;

  // Products Analysis (FA-03)
  productsAnalysisTitle: string;
  productsAnalysisSubtitle: string;
  productsAnalysisMostSoldBrand: string;
  productsAnalysisMostSoldItem: string;
  productsAnalysisMostSoldCombo: string;
  productsAnalysisHighestMargin: string;

  serviceDeliveryDesc: string;
  serviceInstallationDesc: string;
  serviceShopInstallationDesc: string;
  serviceShopInstallationBadge: string;
  serviceShopDirectNotice: string;
  serviceLocationPrecisionError: string;
  calendarTitle: string;
  calendarSelectDate: string;
  calendarSelectedDate: string;
  calendarClosedSunday: string;
  calendarPrevMonth: string;
  calendarNextMonth: string;
  timeSlotMorning: string;
  timeSlotAfternoon: string;
  garageOriginLabel: string;
  garageOriginAddress: string;
  destinationInputLabel: string;
  destinationInputPlaceholder: string;
  quickLocationsLabel: string;
  useCurrentLocationBtn: string;
  calculatingRoute: string;
  distanceLabel: string;
  timeLabel: string;
  ratePerKmLabel: string;
  baseRateLabel: string;
  totalCostLabel: string;
  openGoogleMapsBtn: string;
  openWazeBtn: string;
  requestServiceWhatsAppBtn: string;
  backdoorLogisticsTab: string;
  backdoorLogisticsTitle: string;
  backdoorLogisticsSubtitle: string;
  backdoorPickupRate: string;
  backdoorDeliveryRate: string;
  backdoorInstallationRate: string;
  backdoorPickupBase: string;
  backdoorDeliveryBase: string;
  backdoorInstallationBase: string;
  backdoorGarageAddress: string;
  backdoorRatesSavedSuccess: string;
  backdoorTestCalculatorTitle: string;
  serviceOrdersTitle: string;
  serviceOrdersSubtitle: string;
  serviceOrdersNoneFound: string;
  serviceOrdersLoginPrompt: string;
  serviceOrdersSearchPlaceholder: string;
  serviceOrdersSearchBtn: string;
  serviceOrdersSelectedOrder: string;
  serviceOrdersRequiredNotice: string;
  serviceDateTitle: string;
  serviceDateLabel: string;
  serviceTimeLabel: string;
  servicePresenceNotice: string;
  serviceScheduleBtn: string;
  serviceScheduleRequiresOrder: string;
  serviceScheduleRequiresLocation: string;
  serviceScheduleRequiresDate: string;
  serviceScheduleSuccess: string;
  clickMapToSetLocation: string;
  serviceAvailabilityTitle: string;
  serviceOperatingHours: string;
  serviceSlotBlocked: string;
  serviceSlotAvailable: string;
  serviceSelectedTime: string;
  serviceTravelBufferExplanation: string;
  serviceHomeInstallFullDayNote: string;
  serviceCostResumeTitle: string;
  serviceTripSummaryHeading: string;
  serviceRoundTripTravel: string;
  serviceBufferPrep: string;
  servicePayAndReserveBtn: string;
  serviceConfirmAndReserveFreeBtn: string;
  serviceTransferAmount: string;
  serviceFreeTransportNotice: string;
  serviceUploadingReceipt: string;
  serviceRegisteringReservation: string;
  servicePaymentReceiptRequired: string;
  servicePhoneRequired: string;
  serviceTermsRequired: string;
  servicePaymentAccountsHeading: string;
  servicePaymentAccountsSubtitle: string;
  servicePaymentProofSuccess: string;
  servicePhoneInputLabel: string;
  servicePhoneInputHelp: string;
  servicePaymentAgreementNotice: string;
  servicePaymentAgreementCheckbox: string;
  serviceProceedToPaymentBtn: string;
  serviceProceedToConfirmFreeBtn: string;
  serviceOrdersDeselect: string;
  serviceOrdersDeselectAll: string;
  serviceOrdersMultiAllowed: string;
  serviceOrdersSingleOnly: string;
  serviceBackToServices: string;
  servicePaymentStepTitle: string;
  servicePaymentStepSubtitle: string;
  serviceSummaryTitle: string;
  serviceMultipleOrdersCount: string;
  serviceSelectedOrdersLabel: string;
  serviceHomeInstallIneligibleBadge: string;
  serviceHomeInstallIneligibleReason: string;
  serviceHomeInstallIneligibleOrderAlert: string;
  serviceHomeInstallAutoSwitchedNotice: string;
  serviceHomeInstallBackendDisqualified: string;
  serviceHomeInstallOrderTag: string;
  serviceOrdersInstallFeeLabel: string;
  serviceTransportFeeLabel: string;
  serviceTotalWithInstallLabel: string;
  servicePickupInstallHeading: string;
  servicePickupInstallPaidOnRetrievalNotice: string;
  serviceShopInstallReserveBtn: string;
  serviceShopInstallNotice: string;
  serviceShopInstallOverlayTitle: string;
  serviceShopInstallOverlaySub: string;
  serviceSubtotalNetLabel: string;
  serviceIvaTaxLabel: string;
  serviceOrderAlreadyInConfirmation: string;
  serviceOrderAlreadyProgrammed: string;
  serviceOrderAlreadyProgrammedBadge: string;
  serviceSlotCollisionAlert: string;
  servicePayWithCardBac: string;
  servicePayWithCardBacDesc: string;
  servicePayWithCardGenerating: string;
  installationPayWithCardBac: string;
  installationPayWithCardBacDesc: string;
  installationPayWithCardGenerating: string;
  serviceTotalWithIvaLabel: string;
  servicePricesIncludeIvaBadge: string;
  installationLaborSubtotalLabel: string;
  installationIvaTaxLabel: string;
  installationTotalWithIvaLabel: string;
  backdoorBlockHoursModalTitle: string;
  backdoorBlockModeLabel: string;
  backdoorBlockModeHours: string;
  backdoorBlockModeDay: string;
  backdoorBlockModeRuta: string;
  backdoorBlockStartHour: string;
  backdoorBlockEndHour: string;
  backdoorBlockReasonLabel: string;
  backdoorBlockSaveBtn: string;
  backdoorBlockedHoursBadge: string;
  serviceBlockedHoursNotice: string;
  serviceInTransitNotice: string;
  backdoorVehiclesTab: string;
  backdoorVehiclesTitle: string;
  backdoorVehiclesSubtitle: string;
  backdoorVehiclesAddBtn: string;
  backdoorVehiclesTotalBrands: string;
  backdoorVehiclesTotalModels: string;
  backdoorVehiclesSearchPlaceholder: string;
  backdoorVehiclesFilterAllBrands: string;
  backdoorVehiclesFilterAllCategories: string;
  backdoorVehiclesModalCreateTitle: string;
  backdoorVehiclesModalEditTitle: string;
  backdoorVehiclesBrandLabel: string;
  backdoorVehiclesSelectBrandPrompt: string;
  backdoorVehiclesCreateNewBrandToggle: string;
  backdoorVehiclesNewBrandName: string;
  backdoorVehiclesNewBrandSlug: string;
  backdoorVehiclesModelNameLabel: string;
  backdoorVehiclesModelSlugLabel: string;
  backdoorVehiclesModelCodeLabel: string;
  backdoorVehiclesModelCodePlaceholder: string;
  backdoorVehiclesModelCodeHelp: string;
  backdoorVehiclesCategoryLabel: string;
  backdoorVehiclesYearsLabel: string;
  backdoorVehiclesYearFromLabel: string;
  backdoorVehiclesYearToLabel: string;
  backdoorVehiclesImageUrlLabel: string;
  backdoorVehiclesUploadImageBtn: string;
  backdoorVehiclesUploadingImage: string;
  backdoorVehiclesRemoveImageBtn: string;
  backdoorVehiclesChangeImageBtn: string;
  backdoorVehiclesSaveSuccess: string;
  backdoorVehiclesUpdateSuccess: string;
  backdoorVehiclesDeleteConfirm: string;
  backdoorVehiclesDeleteSuccess: string;
  backdoorVehiclesEmptyState: string;
  backdoorVehiclesPickupEligibleLabel: string;
  backdoorVehiclesPickupEligibleHelp: string;

  // Garage Brands Management Keys
  backdoorVehiclesSubtabModels: string;
  backdoorVehiclesSubtabBrands: string;
  backdoorVehiclesBrandsTitle: string;
  backdoorVehiclesBrandsSubtitle: string;
  backdoorVehiclesAddBrandBtn: string;
  backdoorVehiclesEditBrandBtn: string;
  backdoorVehiclesBrandModalCreateTitle: string;
  backdoorVehiclesBrandModalEditTitle: string;
  backdoorVehiclesBrandNameLabel: string;
  backdoorVehiclesBrandSlugLabel: string;
  backdoorVehiclesBrandLogoLabel: string;
  backdoorVehiclesBrandUploadLogoBtn: string;
  backdoorVehiclesBrandUploadingLogo: string;
  backdoorVehiclesBrandDefaultVehicleImgLabel: string;
  backdoorVehiclesBrandDefaultVehicleImgHelp: string;
  backdoorVehiclesBrandUploadVehicleImgBtn: string;
  backdoorVehiclesBrandUploadingVehicleImg: string;
  backdoorVehiclesBrandDescEsLabel: string;
  backdoorVehiclesBrandDescEnLabel: string;
  backdoorVehiclesBrandFeaturedLabel: string;
  backdoorVehiclesBrandFeaturedHelp: string;
  backdoorVehiclesBrandSaveSuccess: string;
  backdoorVehiclesBrandUpdateSuccess: string;
  backdoorVehiclesBrandDeleteConfirm: string;
  backdoorVehiclesBrandDeleteSuccess: string;
  backdoorVehiclesBrandEmptyState: string;
  backdoorVehiclesBrandSearchPlaceholder: string;
  backdoorVehiclesBrandFilterAll: string;
  backdoorVehiclesBrandFilterFeatured: string;
  backdoorVehiclesBrandFilterStandard: string;
  backdoorVehiclesBrandModelsCount: string;

  // Pick-Up Service Garage Vehicle Compatibility Keys
  servicePickupVehicleIncompatibleBadge: string;
  servicePickupVehicleIncompatibleAlert: string;
  servicePickupVehicleIncompatibleDesc: string;
  servicePickupVehicleCompatibleBadge: string;
  servicePickupNoGarageVehicleNotice: string;
  servicePickupGarageVehicleLabel: string;
  servicePickupOpenGarageBtn: string;
  servicePickupCompatVerifiedNotice: string;
  servicePickupGarageCompatTitle: string;
  servicePickupGarageCompatSubtitle: string;
  servicePickupGarageCompatSuccess: string;
  servicePickupGarageCompatFail: string;

  // New keys for Agenda, Bank Accounts, Unsaved Changes & Order status
  orderStatusPreparingOrder: string;
  orderStatusPreparingOrderDesc: string;
  orderTransportOnlyAfterPaymentNotice: string;
  devUnsavedChangesTitle: string;
  devUnsavedChangesPrompt: string;
  devUnsavedChangesStay: string;
  devUnsavedChangesDiscard: string;
  backdoorAgendaTab: string;
  backdoorBankAccountsTab: string;
  backdoorBankAccountsTitle: string;
  backdoorBankAccountsSubtitle: string;
  backdoorBankAccountsAddBtn: string;
  backdoorBankAccountsEditTitle: string;
  backdoorBankAccountsCreateTitle: string;
  backdoorBankAccountsDeleteConfirm: string;
  backdoorBankAccountsDeleteSuccess: string;
  backdoorBankAccountsSaveSuccess: string;
  backdoorBankAccountsSubTabAccounts: string;
  backdoorBankAccountsSubTabDiscounts: string;
  backdoorExchangeRateTab: string;
  backdoorExchangeRateTitle: string;
  backdoorExchangeRateSubtitle: string;
  backdoorExchangeRateLiveLabel: string;
  backdoorExchangeRateBuyLabel: string;
  backdoorExchangeRateAutoMode: string;
  backdoorExchangeRateManualMode: string;
  backdoorExchangeRateAutoDesc: string;
  backdoorExchangeRateManualDesc: string;
  backdoorExchangeRateInputLabel: string;
  backdoorExchangeRateBuyInputLabel: string;
  backdoorExchangeRateNotesLabel: string;
  backdoorExchangeRateNotesPlaceholder: string;
  backdoorExchangeRateSaveManualBtn: string;
  backdoorExchangeRateRestoreAutoBtn: string;
  backdoorExchangeRateSyncNowBtn: string;
  backdoorExchangeRateDiagnosticsTitle: string;
  backdoorExchangeRateProviderStatus: string;
  backdoorExchangeRateLatency: string;
  backdoorExchangeRateStatusActive: string;
  backdoorExchangeRateStatusOverride: string;
  backdoorExchangeRateLastSync: string;
  backdoorBankAccountsSubTabExchangeRate: string;
  backdoorBankAccountsExchangeSectionTitle: string;
  backdoorBankAccountsExchangeSectionDesc: string;
  backdoorBankAccountsManageExchangeBtn: string;
  backdoorDiscountsTitle: string;
  backdoorDiscountsSubtitle: string;
  backdoorDiscountsAddBtn: string;
  backdoorDiscountsEditTitle: string;
  backdoorDiscountsCreateTitle: string;
  backdoorDiscountsDeleteConfirm: string;
  backdoorDiscountsSaveSuccess: string;
  backdoorDiscountsDeleteSuccess: string;
  backdoorDiscountsCode: string;
  backdoorDiscountsCodePlaceholder: string;
  backdoorDiscountsDescription: string;
  backdoorDiscountsDescriptionPlaceholder: string;
  backdoorDiscountsType: string;
  backdoorDiscountsTypePercentage: string;
  backdoorDiscountsTypeFixed: string;
  backdoorDiscountsValue: string;
  backdoorDiscountsMinOrder: string;
  backdoorDiscountsMaxDiscount: string;
  backdoorDiscountsMaxUses: string;
  backdoorDiscountsUsesCount: string;
  backdoorDiscountsExpiresAt: string;
  backdoorDiscountsStatusActive: string;
  backdoorDiscountsStatusInactive: string;
  backdoorDiscountsEmpty: string;
  checkoutDiscountTitle: string;
  checkoutDiscountPlaceholder: string;
  checkoutDiscountApplyBtn: string;
  checkoutDiscountApplying: string;
  checkoutDiscountRemoveBtn: string;
  checkoutDiscountAppliedSuccess: string;
  checkoutDiscountRowLabel: string;
  backdoorAgendaTitle: string;
  backdoorAgendaSubtitle: string;
  backdoorAgendaCalendarView: string;
  backdoorAgendaWeekView: string;
  backdoorAgendaMonthView: string;
  backdoorAgendaWarrantyTab: string;
  backdoorAgendaWeekInstallsOnly: string;
  backdoorAgendaWeekAllServices: string;
  backdoorAgendaWeekCurrentTime: string;
  backdoorAgendaWarrantyCount: string;
  backdoorAgendaWarrantyDesc: string;
  backdoorAgendaChronologicalView: string;
  backdoorAgendaScheduleServiceBtn: string;
  backdoorAgendaServiceDetails: string;
  backdoorAgendaTransportPaymentConfirmed: string;
  backdoorAgendaTransportPaymentPending: string;
  backdoorAgendaConfirmTransportPaymentBtn: string;
  backdoorAgendaTransportPaymentSuccess: string;
  backdoorBlockDaysBtn: string;
  backdoorBlockDaysTitle: string;
  backdoorBlockDaysSubtitle: string;
  backdoorBlockDayToggle: string;
  backdoorRutaBarrialToggle: string;
  backdoorSaveBlockBtn: string;
  backdoorUnblockBtn: string;
  backdoorAppointmentCodeLabel: string;
  backdoorSearchByCodeOrOrder: string;
  backdoorEditAppointmentTitle: string;
  backdoorEliminateAppointmentBtn: string;
  backdoorEliminateAppointmentConfirm: string;
  backdoorEliminateAppointmentSuccess: string;
  backdoorSaveAppointmentBtn: string;
  backdoorTimeOverrideNote: string;
  backdoorSearchOrderPlaceholder: string;
  backdoorSelectedOrderLabel: string;
  backdoorChangeOrderBtn: string;
  calendarRutaBarrialBadge: string;
  calendarDayBlockedBadge: string;

  // Backdoor Home Page Content Manager
  backdoorHomePageTab: string;
  backdoorHomePageTitle: string;
  backdoorHomePageSubtitle: string;
  backdoorHomeAllItems: string;
  backdoorHomeVideos: string;
  backdoorHomeProducts: string;
  backdoorHomeAddItem: string;
  backdoorHomeEditItem: string;
  backdoorHomeDeleteItem: string;
  backdoorHomeItemType: string;
  backdoorHomeTypeVideo: string;
  backdoorHomeTypeProduct: string;
  backdoorHomeTitleEs: string;
  backdoorHomeTitleEn: string;
  backdoorHomeCategory: string;
  backdoorHomeCategoryPlaceholder: string;
  backdoorHomeDescEs: string;
  backdoorHomeDescEn: string;
  backdoorHomeRedirectUrl: string;
  backdoorHomeRedirectPlaceholder: string;
  backdoorHomeMediaUrl: string;
  backdoorHomeMediaPlaceholder: string;
  backdoorHomeVideoUrl: string;
  backdoorHomeVideoPlaceholder: string;
  backdoorHomeOrder: string;
  backdoorHomeIsActive: string;
  backdoorHomeStatusActive: string;
  backdoorHomeStatusInactive: string;
  backdoorHomeSaveBtn: string;
  backdoorHomeSaving: string;
  backdoorHomeCancelBtn: string;
  backdoorHomeDeleteConfirm: string;
  backdoorHomeEmptyState: string;
  backdoorHomeSuccessCreated: string;
  backdoorHomeSuccessUpdated: string;
  backdoorHomeSuccessDeleted: string;
  backdoorHomeActions: string;
  backdoorHomeSearchPlaceholder: string;
  backdoorHomeUploadImageBtn: string;
  backdoorHomeUploadVideoBtn: string;
  backdoorHomeUploadingImage: string;
  backdoorHomeUploadingVideo: string;
  backdoorHomeChangeImage: string;
  backdoorHomeChangeVideo: string;
  backdoorHomeRemoveImage: string;
  backdoorHomeRemoveVideo: string;
  backdoorHomeManualUrlToggle: string;
  heroRelatedModalTitle: string;
  heroRelatedModalSubtitle: string;
  heroRelatedProductBadge: string;
  heroRelatedComboBadge: string;
  heroRelatedViewProduct: string;
  heroRelatedViewCombo: string;
  heroRelatedCloseModal: string;
  backdoorHomeRelatedItemsSectionTitle: string;
  backdoorHomeRelatedItemsSectionDesc: string;
  backdoorHomeRelatedAddBtn: string;
  backdoorHomeRelatedSearchPlaceholder: string;
  backdoorHomeRelatedEmpty: string;
  backdoorHomeRelatedReplaceBtn: string;
  backdoorHomeRelatedRemoveBtn: string;
  backdoorHomeRelatedReplacingMode: string;
  backdoorHomeRelatedCancelReplace: string;
  backdoorHomeRelatedFilterAll: string;
  backdoorHomeRelatedFilterProducts: string;
  backdoorHomeRelatedFilterCombos: string;
  backdoorHomeSubTabMedia: string;
  backdoorHomeSubTabDealerBrands: string;
  backdoorDealerBrandsTitle: string;
  backdoorDealerBrandsSubtitle: string;
  backdoorDealerBrandsAllCount: string;
  backdoorDealerBrandsAddBtn: string;
  backdoorDealerBrandsEditBtn: string;
  backdoorDealerBrandsName: string;
  backdoorDealerBrandsNamePlaceholder: string;
  backdoorDealerBrandsCode: string;
  backdoorDealerBrandsCodePlaceholder: string;
  backdoorDealerBrandsCodeHelp: string;
  backdoorDealerBrandsLogo: string;
  backdoorDealerBrandsUploadLogo: string;
  backdoorDealerBrandsUploadingLogo: string;
  backdoorDealerBrandsChangeLogo: string;
  backdoorDealerBrandsRemoveLogo: string;
  backdoorDealerBrandsRedirectUrl: string;
  backdoorDealerBrandsRedirectPlaceholder: string;
  backdoorDealerBrandsAutoRedirectHint: string;
  backdoorDealerBrandsOrder: string;
  backdoorDealerBrandsIsActive: string;
  backdoorDealerBrandsDeleteConfirm: string;
  backdoorDealerBrandsEmpty: string;
  backdoorDealerBrandsSuccessCreated: string;
  backdoorDealerBrandsSuccessUpdated: string;
  backdoorDealerBrandsSuccessDeleted: string;
  backdoorDealerBrandsSearchPlaceholder: string;
  backdoorDealerBrandsWheelPreview: string;

  // BarrialCR Community & Page
  barrialCrHeroBadge: string;
  barrialCrScrollDown: string;
  barrialCrAboutTitle: string;
  barrialCrRidesTitle: string;
  barrialCrJoinChatPrompt: string;
  barrialCrLoading: string;
  barrialCrBadgeCommunity: string;
  barrialCrBadgeRutas: string;
  barrialCrBadgeCostaRica: string;
  barrialCrUpcomingRidesTitle: string;
  barrialCrUpcomingRidesSubtitle: string;
  barrialCrNoRidesPlanned: string;
  barrialCrNoRidesSub: string;
  barrialCrRideConfirmed: string;
  barrialCrRideMeetingPoint: string;
  barrialCrRideTime: string;
  barrialCrRideJoinWhatsApp: string;
  barrialCrRidePastBadge: string;
  barrialCrCalendarSyncNotice: string;
  backdoorBarrialCrCalendarRidesTitle: string;
  backdoorBarrialCrCalendarRidesSubtitle: string;
  backdoorBarrialCrAddRideBtn: string;
  backdoorBarrialCrNoCalendarRides: string;

  // Backdoor BarrialCR Manager
  backdoorHomeSubTabBarrialCr: string;
  backdoorBarrialCrTitle: string;
  backdoorBarrialCrSubtitle: string;
  backdoorBarrialCrHeroSettings: string;
  backdoorBarrialCrVideoUrl: string;
  backdoorBarrialCrUploadVideo: string;
  backdoorBarrialCrUploadingVideo: string;
  backdoorBarrialCrPosterUrl: string;
  backdoorBarrialCrUploadPoster: string;
  backdoorBarrialCrTitleLabel: string;
  backdoorBarrialCrSubtitleEs: string;
  backdoorBarrialCrSubtitleEn: string;
  backdoorBarrialCrCommunitySettings: string;
  backdoorBarrialCrLogoUrl: string;
  backdoorBarrialCrUploadLogo: string;
  backdoorBarrialCrUploadingLogo: string;
  backdoorBarrialCrDescEs: string;
  backdoorBarrialCrDescEn: string;
  backdoorBarrialCrWhatsappLink: string;
  backdoorBarrialCrWhatsappLinkHelp: string;
  backdoorBarrialCrWhatsappBtnEs: string;
  backdoorBarrialCrWhatsappBtnEn: string;
  backdoorBarrialCrStatusLabel: string;
  backdoorBarrialCrStatusActive: string;
  backdoorBarrialCrStatusInactive: string;
  backdoorBarrialCrSaveBtn: string;
  backdoorBarrialCrSaving: string;
  backdoorBarrialCrSuccessSaved: string;
  backdoorBarrialCrPreviewBtn: string;

  // Backdoor Workshop & Phone Manager
  backdoorWorkshopTab: string;
  backdoorWorkshopTitle: string;
  backdoorWorkshopSubtitle: string;
  backdoorPhoneLabel: string;
  backdoorPhonePlaceholder: string;
  backdoorPhoneHelp: string;
  backdoorLegalNameLabel: string;
  backdoorLegalNamePlaceholder: string;
  backdoorLegalNameHelp: string;
  backdoorCedulaJuridicaLabel: string;
  backdoorCedulaJuridicaPlaceholder: string;
  backdoorCedulaJuridicaHelp: string;
  backdoorWhatsappLabel: string;
  backdoorHoursLabel: string;
  backdoorHoursHelp: string;
  backdoorAddressLabel: string;
  backdoorAddressEnLabel: string;
  backdoorSaveWorkshopBtn: string;
  backdoorSavingWorkshop: string;
  backdoorWorkshopPreview: string;
  backdoorWorkshopError: string;
  backdoorSaveContactSuccess: string;

  // Category multi-select
  devProductCategoriesLabel: string;
  devAddAnotherCategoryBtn: string;
  devSelectCategoryToAdd: string;
  devNoCategoriesSelected: string;

  // Dealer Warranty Protection & Voids Warranty
  devVoidsWarrantyLabel: string;
  devVoidsWarrantyDesc: string;
  devVoidsWarrantyBadge: string;
  warrantyProtectionBannerTitle: string;
  warrantyProtectionBannerDesc: string;
  warrantyProtectionBannerCta: string;
  warrantyProtectionPageTitle: string;
  warrantyProtectionPageSubtitle: string;
  warrantyProtectionHowItWorksTitle: string;
  warrantyProtectionStep1Title: string;
  warrantyProtectionStep1Desc: string;
  warrantyProtectionStep2Title: string;
  warrantyProtectionStep2Desc: string;
  warrantyProtectionStep3Title: string;
  warrantyProtectionStep3Desc: string;
  warrantyProtectionStep4Title: string;
  warrantyProtectionStep4Desc: string;
  warrantyProtectionFaqTitle: string;
  warrantyProtectionFaq1Q: string;
  warrantyProtectionFaq1A: string;
  warrantyProtectionFaq2Q: string;
  warrantyProtectionFaq2A: string;
  warrantyProtectionFaq3Q: string;
  warrantyProtectionFaq3A: string;
  warrantyProtectionContactBtn: string;
  warrantyProtectionBackBtn: string;
  warrantyProtectionProfileBtn: string;
  warrantyProtectionProfileSubtitle: string;
  warrantyProtectionPartsTitle: string;
  warrantyProtectionPartsSubtitle: string;
  warrantyProtectionCostFormula: string;
  warrantyProtectionInstallCostLabel: string;
  warrantyProtectionDeinstallReinstallLabel: string;
  warrantyProtectionSelectParts: string;
  warrantyProtectionProceedService: string;
  warrantyProtectionGoToScreen: string;
  warrantyProtectionNoParts: string;
  warrantyProtectionNoPartsDesc: string;
  warrantyProtectionOnlyZxzNotice: string;
  warrantyProtectionTotalToPay: string;
  warrantyProtectionCreatingOrder: string;
  warrantyProtectionLoginRequired: string;
  warrantyProtectionLoginPrompt: string;
  warrantyProtectionExploreCatalog: string;
  warrantyProtectionSelectedCount: string;

  // Related / Recommended Products
  devRelatedProductsTitle: string;
  devRelatedProductsDesc: string;
  devAddRelatedProductPlaceholder: string;
  devNoRelatedProducts: string;
  productRelatedTitle: string;
  productRelatedSubtitle: string;

  // Suggested Products & Combos (For function & damage prevention - distinct from recommended)
  productSuggestionsSectionTitle: string;
  productSuggestionsSectionSubtitle: string;
  suggestionTypeProduct: string;
  suggestionTypeCombo: string;
  suggestionBadge: string;
  suggestionAddToCart: string;
  suggestionInCart: string;
  suggestionAddedSuccess: string;
  devSuggestionsTitle: string;
  devSuggestionsDesc: string;
  devSuggestionsSearchPlaceholder: string;
  devNoSuggestionsTagged: string;
  devTagTypeAll: string;
  devTagTypeProducts: string;
  devTagTypeCombos: string;

  // Description bullet helper
  devBulletListHelp: string;
  devAddBulletTemplateBtn: string;

  // Product percentage discount
  devProductDiscountPercent: string;
  devProductDiscountHelp: string;
  devProductBasePrice: string;
  devProductDiscountAmount: string;
  devProductFinalPrice: string;
  devProductNoDiscount: string;

  // Profile Banning System (Master Only)
  backdoorUserBansTab: string;
  userBanTitle: string;
  userBanSubtitle: string;
  userBanSearchPlaceholder: string;
  userBanSearchHelp: string;
  userBanNoUserFound: string;
  userBanInitialStatePrompt: string;
  userBanActiveStatus: string;
  userBanBannedStatus: string;
  userBanDateLabel: string;
  userBanReasonLabel: string;
  userBanByLabel: string;
  userBanActionBanBtn: string;
  userBanActionUnbanBtn: string;
  userBanModalTitle: string;
  userBanModalSubtitle: string;
  userBanReasonPrompt: string;
  userBanReasonPlaceholder: string;
  userBanConfirmBanBtn: string;
  userBanConfirmUnbanBtn: string;
  userBanCancelBtn: string;
  userBanSuccessBan: string;
  userBanSuccessUnban: string;
  userBanRegisteredAt: string;
  userBanLastLogin: string;
  userBanOrdersCount: string;
  userBanVehiclesCount: string;
  userBanPhoneLabel: string;
  userBanRoleLabel: string;
  userBanCannotBanSelf: string;
  userBanCannotBanMaster: string;
  userBanDefaultReason: string;
  userBanAccountSuspendedNotice: string;

  // Physical Service Documents & PDF System
  serviceDocsBtn: string;
  serviceDocsModalTitle: string;
  serviceDocsModalSubtitle: string;
  serviceDocsTabReception: string;
  serviceDocsTabHandover: string;
  serviceDocsTabAgreement: string;
  serviceDocsTabTransportAuth: string;
  serviceDocsTabTransportReturn: string;
  serviceDocsTabDelivery: string;
  serviceDocsPrintBtn: string;
  serviceDocsFillDetails: string;
  serviceDocsLicensePlate: string;
  serviceDocsVin: string;
  serviceDocsMileage: string;
  serviceDocsVehicleColor: string;
  serviceDocsReceiverName: string;
  serviceDocsPreDamages: string;
  serviceDocsFreeWash: string;
  serviceDocsFreeWashYes: string;
  serviceDocsFreeWashNo: string;
  serviceDocsCedulaLabel: string;
  serviceDocsOwnerNameLabel: string;
  serviceDocsSignOwner: string;
  serviceDocsSignStaff: string;
  serviceDocsSaveDataBtn: string;
  serviceDocsSaveSuccess: string;
  serviceDocsKeysCheck: string;
  serviceDocsSpareKeyCheck: string;
  serviceDocsKeysCount: string;
  serviceDocsFuelLevel: string;
  serviceDocsNoBelongings: string;
  serviceDocsBatteryCheck: string;
  serviceDocsParkingBrakeCheck: string;
  serviceDocsTiresCheck: string;
  serviceDocsLeaksCheck: string;
  serviceDocsDocsCheck: string;
  serviceDocsKeysReturnedCheck: string;

  // ZxZ Quality Certification (Warehouse Product Checked)
  zxzCertBadge: string;
  zxzCertTitle: string;
  zxzCertSubtitle: string;
  zxzCertViewBtn: string;
  zxzCertDownloadBtn: string;
  zxzCertInspector: string;
  zxzCertStatusVerified: string;
  zxzCertCustomerBannerTitle: string;
  zxzCertCustomerBannerSub: string;

  // Pick-Up Service Enable/Disable by Master
  servicePickupDisabledBadge: string;
  servicePickupDisabledDesc: string;
  servicePickupDisabledAlert: string;
  backdoorPickupStatusLabel: string;
  backdoorPickupEnabledBadge: string;
  backdoorPickupDisabledBadge: string;
  backdoorPickupEnableBtn: string;
  backdoorPickupDisableBtn: string;
  backdoorPickupToggleDesc: string;

  // Common Breadcrumbs & Navigation
  breadcrumbHome: string;
  breadcrumbBrands: string;
  breadcrumbPerformance: string;
  breadcrumbQuote: string;
  breadcrumbProducts: string;
  breadcrumbCombos: string;
  breadcrumbOrders: string;
  breadcrumbTerms: string;
  breadcrumbDocuments: string;
  btnBackToHome: string;
  btnBackToOrders: string;
  btnBackToOrder: string;
  btnExploreProducts: string;
  btnExploreShop: string;
  btnComingSoon: string;

  // Accessibility & Global Badges
  ariaClearSearch: string;
  ariaCloseModal: string;
  ariaCloseProfile: string;
  ariaCloseCart: string;
  ariaDecreaseQty: string;
  ariaIncreaseQty: string;
  ariaPreviousProduct: string;
  ariaNextProduct: string;
  ariaCloseZoom: string;
  badgeDiscountOff: string;
  badgeAudioHd: string;
  badgeActiveStatus: string;
  labelQuantityShort: string;
  labelUnitEach: string;
  currencyColonesLabel: string;
  currencyDollarsLabel: string;
  exchangeRateBccrPrefix: string;
  vatIncludedNotice: string;
  warrantyLaborNotice: string;
  redirectingToOrderClaim: string;

  // Performance Page (/performance)
  performanceBadge: string;
  performancePageTitle: string;
  performancePageSubtitle: string;
  performanceQuoteCustomBtn: string;
  performanceMostPopular: string;
  performanceHpGainLabel: string;
  performanceTorqueGainLabel: string;
  performanceIncludesLabel: string;
  performanceDynoBadge: string;
  performanceLaborWarrantyBadge: string;
  performancePricePrefix: string;
  performanceInstallationIncludedNotice: string;
  performanceAddToCartBtn: string;
  performanceAppliesToLabel: string;

  // Quote Page (/cotizar)
  quoteBadge: string;
  quotePageTitle: string;
  quotePageSubtitle: string;
  quoteStep1Title: string;
  quoteYearLabel: string;
  quoteSelectYear: string;
  quoteMakeLabel: string;
  quoteSelectMake: string;
  quoteModelLabel: string;
  quoteSelectModel: string;
  quoteStep2Title: string;
  quoteInterestPackageTitle: string;
  quoteInterestPackageDesc: string;
  quoteInterestPartsTitle: string;
  quoteInterestPartsDesc: string;
  quoteInterestMaintenanceTitle: string;
  quoteInterestMaintenanceDesc: string;
  quoteInterestCustomTitle: string;
  quoteInterestCustomDesc: string;
  quoteSpecificDetailsLabel: string;
  quoteSpecificDetailsPlaceholder: string;
  quoteWorkshopIncludeLabel: string;
  quoteWorkshopWarrantyNotice: string;
  quoteWorkshopLocationBadge: string;
  quoteStep3Title: string;
  quoteClientNameLabel: string;
  quoteClientNamePlaceholder: string;
  quoteClientPhoneLabel: string;
  quoteClientPhonePlaceholder: string;
  quoteImmediateResponseNotice: string;
  quoteSubmitWhatsappBtn: string;
  quoteAlertSelectVehicle: string;
  quoteAlertFillContact: string;

  // Documents Page (/documentos)
  docsOfficialPortalTitle: string;
  docsWarranty60DaysTitle: string;
  docsWarranty60DaysDesc: string;
  docsWarranty90DaysTitle: string;
  docsWarranty90DaysDesc: string;
  docsWarrantyEcuTitle: string;
  docsWarrantyEcuDesc: string;
  docsDocumentOfficialPrefix: string;
  docsActiveLabel: string;
  docsJurisdictionLabel: string;
  docsJurisdictionValue: string;
  docsCorporateName: string;
  docsLegalIdNotice: string;
  docsCloseModal: string;
  docsLastUpdated: string;
  docsLoading: string;
  docsDefaultTitle: string;

  // Order Claim (/pedidos/reclamar/[token])
  claimInvalidLinkTitle: string;
  claimInvalidLinkDesc: string;
  claimViewProfileBtn: string;
  claimGoToStoreBtn: string;
  claimSuccessTitle: string;
  claimOrderLinkedBadge: string;
  claimOrderSuccessDesc: string;
  claimViewInMyAccountBtn: string;
  claimSpecialQuoteHeader: string;
  claimOrderNumberPrefix: string;
  claimOrderTotalLabel: string;
  claimItemsListLabel: string;
  claimItemDefaultTitle: string;

  // Installation Checkout (/pedidos/[id]/pagar-instalacion)
  instCheckoutHeader: string;
  instCheckoutSubtitle: string;
  instCheckoutDesc: string;
  instLaborSubtotal: string;
  instVatIncluded: string;
  instTotalAmount: string;
  instBreakdownTitle: string;
  instOfficialAccountsTitle: string;
  instOfficialAccountsSub: string;
  instUploadProofTitle: string;
  instDropzonePrompt: string;
  instPhoneRequired: string;
  instPhoneBadgeRequired: string;
  instAlreadyConfirmed: string;
  instUnderReview: string;
  instNotAvailableYet: string;
  instMaxFileSizeError: string;
  instUploadingProof: string;
  instRegisteringPayment: string;
  instPaymentSuccess: string;
  instVerifiedAccountsBadge: string;

  // Home Page Sections
  homeNavigatingAdapted: string;
  homeCostaRicaHq: string;
  homeHqSubtitle: string;
  homeSpecializedBrandsTitle: string;
  homeConfigureFullVehicle: string;
  homeModelsCountLabel: string;
  homePopularModelsLabel: string;
  homeCombosSectionSubtitle: string;
  homeCombosNetPriceNotice: string;
  homePerformanceSectionSubtitle: string;
  homePerformanceMaxPower: string;
  homeWorkshopSubtitle: string;
  homeWorkshopPhysicalTitle: string;
  homeWorkshopAddressLabel: string;
  homeWorkshopPhoneLabel: string;
  homeProductShowcasePrevious: string;
  homeProductShowcaseNext: string;
  homeProductShowcaseViewMore: string;

  // Catalog Pagination
  paginationShowing: string;
  paginationOf: string;
  paginationPrevious: string;
  paginationNext: string;
  paginationPage: string;
}


export const translations: Record<Language, Translations> = {
  es: {
    brandName: "ZxZ Mods",
    tagline: "Especialistas en CFMOTO, UTV & ATV Performance, Modificaciones e Importación",
    subTagline: "Taller técnico especializado en Costa Rica. Piezas de alto rendimiento importadas desde EE.UU., mano de obra profesional y garantías reales por escrito.",
    cfmotoBadge: "ESPECIALIDAD CFMOTO",

    navCfmoto: "CFMOTO Especialidad",
    navBrands: "Marcas",
    navCombos: "Combos",
    navPerformance: "Performance",
    navWorkshop: "Ubicación",
    navBarrialCr: "BarrialCR",
    navQuote: "Instalación a Domicilio",
    navGarage: "Garaje",
    navMyVehicle: "Vehículo en Garaje",
    navNoVehicle: "Configurar Vehículo",
    navChangeVehicle: "Cambiar",
    navCart: "Carrito",
    navDeliveryQuote: "Cotizar Envío",
    navUtvPickup: "Servicio Pick-Up UTV",
    navHomeService: "Instalación a Domicilio",
    navHomeInstallation: "Instalación a Domicilio",
    navProfile: "Mi Cuenta",

    // Authentication & Profile (Firebase Auth & Orders)
    authModalTitle: "Acceder a ZxZ Mods",
    authModalSubtitle: "Gestiona tus pedidos, vehículos en garaje e información técnica",
    authGoogleButton: "Continuar con Google",
    authOrDivider: "o mediante correo electrónico",
    authFullNameLabel: "Nombre y Apellidos",
    authFullNamePlaceholder: "Ej: Juan Carlos Pérez",
    authFullNameRequired: "Por favor ingresa tu nombre completo",
    authEmailPlaceholder: "nombre@ejemplo.com",
    authSendCodeButton: "Enviar Código de Verificación",
    authEnterCode: "Ingresa el código de 6 dígitos enviado a",
    authVerifyButton: "Verificar e Iniciar Sesión",
    authResendCode: "¿No lo recibiste? Reenviar código",
    authChangeEmail: "Cambiar correo",
    authCodeSentTo: "Código enviado a",
    authInvalidCode: "El código ingresado es incorrecto o ha expirado.",
    authSendingCode: "Enviando código...",
    authVerifying: "Verificando...",
    authPromptReasonTitle: "Inicio de Sesión Requerido",
    authGatingGarageReason: "Inicia sesión para guardar y sincronizar tu vehículo en tu Garaje.",
    authGatingCartReason: "Inicia sesión para agregar repuestos y combos a tu carrito de compras.",
    authGatingServiceReason: "Inicia sesión para programar tu servicio técnico, traslado o instalación.",
    authTermsAgreementPrefix: "Al continuar, aceptas nuestros",
    authTermsAgreementLink: "Términos y Condiciones de Servicio",
    authTermsModalTitle: "Términos y Condiciones de Servicio",
    authTermsAcceptBtn: "Aceptar Términos",
    termsNavTitle: "Términos de Servicio",
    termsPageTitle: "Términos y Condiciones del Servicio",
    termsPageSubtitle: "Políticas de garantía, importación de repuestos, servicios de taller y uso de la plataforma ZxZ Mods en Costa Rica.",
    docsNavTitle: "Centro Legal & Documentos",
    docsPageTitle: "Centro de Documentación Legal & Pólizas",
    docsPageSubtitle: "Contratos vinculantes, pólizas de garantía por escrito, normativas de pago por transferencia bancaria y regulaciones de protección al consumidor bajo la legislación de Costa Rica.",
    docsSearchPlaceholder: "Buscar por término o palabra clave...",
    docsIndexTitle: "Documentos Oficiales",
    docsOfficialStamp: "ZxZ Mods Costa Rica S.A. • Documento Oficial Registrado",
    docsNoResults: "No se encontraron documentos con esa palabra clave.",
    docsPrintBtn: "Guardar o Imprimir Copia Oficial",
    docsShareBtn: "Compartir",
    docsShareCopied: "¡Enlace Copiado!",
    docsExecutiveSummary: "Resumen Ejecutivo y Ámbito de Aplicación:",
    docsLegalFramework: "Fundamento Jurídico en Costa Rica:",
    docsContactAdvisor: "Contactar Asesoría",
    docsUnderstoodClose: "Entendido y Cerrar",
    profileTitle: "Perfil & Pedidos",
    profileOrdersTab: "Mis Pedidos",
    profileInfoTab: "Mi Información",
    profileNoOrders: "No tienes pedidos registrados",
    profileNoOrdersDesc: "Cuando realices compras o cotizaciones desde el carrito aparecerán aquí.",
    profileExploreParts: "Explorar Catálogo",
    profileLogout: "Cerrar Sesión",
    profileLoggedInAs: "Sesión iniciada como",
    profileVehicles: "Vehículos Guardados",
    profileFullName: "Nombre Completo",
    profileNamePlaceholder: "Agrega tu nombre completo",
    profileNoNameSet: "Sin nombre configurado",
    profileActiveCart: "Carrito de Compras",
    profileViewCart: "Ver Carrito",
    profileCartOrderInProgress: "Tienes artículos listos en tu carrito para generar un pedido",
    profileEmail: "Correo Electrónico",
    profilePhone: "Teléfono / WhatsApp",
    profilePhonePlaceholder: "+506 8888-8888",
    profileSave: "Guardar Cambios",
    profileSaving: "Guardando...",
    profileSavedSuccess: "Información actualizada correctamente.",
    orderNumberLabel: "Pedido #",
    orderDateLabel: "Fecha",
    orderStatusLabel: "Estado",
    orderTotalLabel: "Total",
    orderItemsLabel: "Artículos",
    ordersPageTitle: "Mis Pedidos",
    ordersPageSubtitle: "Consulta el estado en tiempo real, seguimiento de piezas y detalles de tus pedidos.",
    ordersSearchPlaceholder: "Buscar por # de orden, cliente o repuesto...",
    ordersAuthRequiredTitle: "Inicia Sesión para Ver tus Pedidos",
    ordersAuthRequiredSubtitle: "Accede a tu cuenta para consultar el historial de compras y estado de taller.",
    ordersSignInBtn: "Iniciar Sesión",
    ordersContactWhatsApp: "Consultar por WhatsApp",
    ordersDeliveryService: "Servicio / Entrega",
    ordersItemsLabel: "Artículos del Pedido",
    ordersSummaryLabel: "Resumen del Pedido",
    ordersRedirectBtn: "Ver Mis Pedidos",
    ordersViewTracking: "Ver estado y seguimiento",

    // Servicios Programados (Pantalla del usuario)
    scheduledServicesTitle: "Servicios Programados",
    scheduledServicesSubtitle: "Consulta tus citas de instalación, entrega y taller, reprograma fechas con más de 48 horas de anticipación y comunícate con el equipo.",
    scheduledServicesNoItems: "No tienes servicios programados actualmente",
    scheduledServicesNoItemsDesc: "Cuando reserves una instalación a domicilio, entrega o servicio en taller, podrás ver y gestionar tu cita aquí.",
    scheduledServicesBookBtn: "Agendar un Servicio",
    scheduledServicesAuthRequired: "Inicia sesión para ver tus servicios programados",
    scheduledServicesAuthDesc: "Accede a tu cuenta para consultar y gestionar tus citas de servicio y entregas.",
    scheduledServicesBadgeCanEdit: "Modificable (>48h)",
    scheduledServicesBadgeLocked: "Fecha Bloqueada (<48h)",
    scheduledServicesHoursRemaining: "horas restantes",
    scheduledServicesHoursToDelivery: "Tiempo hasta la entrega/servicio",
    scheduledServicesLockedNotice: "La fecha y hora no se pueden modificar con menos de 48 horas de anticipación a la entrega. Para casos urgentes, comunícate directamente con el taller.",
    scheduledServicesCanEditNotice: "Puedes reprogramar la fecha u hora de esta cita ya que faltan más de 48 horas para la entrega/servicio.",
    scheduledServicesEditDateTime: "Reprogramar Fecha y Hora",
    scheduledServicesModalTitle: "Reprogramar Cita de Servicio",
    scheduledServicesSelectDate: "Nueva Fecha",
    scheduledServicesSelectTime: "Nueva Hora",
    scheduledServicesSaveSchedule: "Confirmar Nueva Fecha",
    scheduledServicesCommentsTitle: "Comentarios y Notas del Servicio",
    scheduledServicesCommentsSubtitle: "Comunícate con el equipo técnico sin importar el tiempo restante para el servicio.",
    scheduledServicesAddCommentPlaceholder: "Escribe un comentario, solicitud especial o indicación para el servicio...",
    scheduledServicesPostComment: "Publicar Comentario",
    scheduledServicesCommentPosted: "Comentario registrado correctamente",
    scheduledServicesRescheduleSuccess: "Cita reprogramada exitosamente",
    scheduledServicesRescheduleError48h: "No es posible modificar la fecha u hora con menos de 48 horas de anticipación.",
    scheduledServicesDrawerButton: "Servicios Programados",
    scheduledServicesDrawerView: "Ver citas y agenda",
    scheduledServicesAppointmentCode: "Código de Cita",
    scheduledServicesServiceTypeLabel: "Tipo de Servicio",
    scheduledServicesDestinationLabel: "Dirección de Destino",
    scheduledServicesWorkshopAddressLabel: "Ubicación del Taller ZxZ",
    scheduledServicesLinkedOrderLabel: "Pedido Vinculado",

    orderStatusCotizacion: "Cotización Proforma",
    orderCotizacionExpiresNote: "Válida por 2 meses a partir de la última actualización o pago. Si no se actualiza o cancela, se eliminará automáticamente.",
    orderCotizacionStaffNotice: "Esta cotización puede ser editada por el equipo técnico de ZxZ Mods para agregar, modificar o remover cualquier pieza que solicites.",
    orderCotizacionEmptyNotice: "Cotización personalizada sin productos de catálogo. Nuestro equipo técnico revisará tus notas y agregará las piezas correspondientes.",
    orderDetailsTitle: "Detalles del Pedido",
    orderDetailsSubtitle: "Información completa, proforma detallada, gestión de pagos y comunicación directa con el taller.",
    orderDownloadReceipt: "Comprobante de compra",
    orderReceiptTitle: "Comprobante Oficial de Compra",
    orderReceiptSubtitle: "Resumen y comprobante formal de pedido para tus registros.",
    orderReceiptPrintBtn: "Imprimir / Guardar como PDF",
    orderReceiptBackToOrder: "Volver a la orden",
    orderReceiptSoldBy: "Vendido y facturado por",
    orderReceiptBilledTo: "Comprador / Facturado a",
    orderReceiptPaymentMethod: "Método de pago",
    orderReceiptPaymentRef: "Referencia / Comprobante",
    orderReceiptDeliveryMethod: "Modalidad de entrega",
    orderReceiptTermsTitle: "Términos, Garantías y Condiciones",
    orderReceiptWarrantyTerms: "Garantía oficial de 90 días en componentes bolt-on y eléctricos, 60 días en mecánica y drivetrain, y soporte técnico de por vida en reprogramaciones de software ECU.",
    orderReceiptDeliveryTerms: "Artículos de importación estadounidense cuentan con un plazo promedio de 7 a 12 días hábiles. Los artículos en stock de taller están disponibles para retiro o instalación coordinada.",
    orderReceiptSupportNotice: "Para cualquier consulta, reclamo o seguimiento de tu orden, contáctanos directamente a ventas@zxzmods.com o vía WhatsApp oficial al +506 7033-2560.",
    orderReceiptOfficialProof: "Este documento certifica que el pedido ha sido procesado formalmente en el sistema de ZxZ Mods Costa Rica y constituye tu comprobante oficial de compra.",
    orderProductsList: "Lista de Productos & Piezas",
    orderProceedToPay: "Proceder al Pago",
    orderScheduleServiceBtn: "Programar Servicio",
    orderRescheduleServiceBtn: "Reprogramar Servicio",
    orderScheduleServiceBannerTitle: "¡Tu orden está lista para programar servicio!",
    orderScheduleServiceBannerSubtitle: "Selecciona fecha y hora para instalación en taller, entrega a domicilio o retiro.",
    orderScheduleServicePrompt: "Tu orden está lista en taller. Agenda tu cita de servicio para coordinar fecha y logística.",
    orderPayModalTitle: "Pagar Orden / Cotización",
    orderPayModalSubtitle: "Elige tu método de pago para confirmar tu pedido y protegerlo contra vencimiento.",
    orderSinpeTitle: "SINPE Móvil Oficial",
    orderSinpeDesc: "Transferencia inmediata al número oficial de ZxZ Mods.",
    orderBankTransferTitle: "Transferencia Bancaria",
    orderBankTransferDesc: "Cuentas IBAN en Colones y Dólares en BCR y BAC Credomatic.",
    orderPaymentReferenceLabel: "Número de Comprobante / Referencia Bancaria",
    orderPaymentPhoneLabel: "Teléfono que realizó el pago",
    orderPaymentConfirmBtn: "Confirmar y Registrar Pago",
    orderPaymentSuccessMsg: "¡Pago registrado exitosamente! Tu cotización ha sido confirmada como pedido oficial.",
    orderCommentsTitle: "Comentarios & Modificaciones",
    orderCommentsSubtitle: "Comunícate con el equipo técnico de ZxZ Mods sobre esta orden. Los comentarios son exclusivamente para información importante sobre la entrega, vehículo o especificaciones técnicas.",
    orderCommentPlaceholder: "Escribe información importante sobre la entrega, especificaciones o detalles técnicos del vehículo...",
    orderCommentSubmit: "Enviar Mensaje",
    orderCommentResetsTimer: "Cualquier comentario actualiza la cotización y renueva automáticamente el plazo de 2 meses.",
    orderActiveQuoteBanner: "Tienes una cotización activa en revisión",
    orderViewDetailsBtn: "Ver Detalle de Orden",
    orderPrintProforma: "Imprimir Proforma",
    orderBackToOrders: "Volver a Mis Pedidos",
    orderPaidCurrencyBadge: "Moneda de pago",
    orderPaidInCRC: "Pagado en Colones (₡)",
    orderPaidInUSD: "Pagado en Dólares ($)",
    orderPayModalCurrencyLabel: "Moneda del pago / transferencia:",
    orderPayModalFixTitle: "Actualizar Comprobante de Pago",
    orderPayModalFixSubtitle: "Adjunta la nueva foto o captura de tu transferencia para verificar tu pago.",
    orderPayModalFixSubmitBtn: "Enviar Comprobante Corregido",
    orderPayModalFixDropzonePrompt: "Haz clic o arrastra aquí tu nuevo comprobante de pago",
    orderUploadProofModalTitle: "Subir Comprobante de Pago",
    orderUploadProofModalSubtitle: "Adjunta la foto o captura de tu pago en el BAC o transferencia para verificar tu pedido.",
    orderUploadProofDropzonePrompt: "Haz clic o arrastra aquí tu comprobante de pago",
    orderUploadProofSubmitBtn: "Enviar Comprobante de Pago",
    orderUploadProofSuccessMsg: "¡Comprobante enviado exitosamente! Tu orden ha pasado a Confirmación de Pago.",
    orderAttachProofStaffBtn: "Adjuntar Comprobante",
    orderApprovePaymentStaffBtn: "Aprobar Pago",
    devInstallDurationLabel: "Tiempo Estimado de Instalación (Horas):",
    devInstallDurationHelp: "Tiempo que tomará instalar esta pieza/combo en el taller o a domicilio.",
    orderInstallationDurationTitle: "Tiempo de Instalación en Taller",
    orderInstallationDurationHoursLabel: "horas de instalación",
    orderSaveInstallationDurationBtn: "Guardar Tiempo",
    orderInstallationDurationSavedSuccess: "Tiempo de instalación actualizado exitosamente.",
    backdoorAgendaMaxInstallsTitle: "Capacidad de Taller",
    backdoorAgendaMaxInstallsBadge: "{count} vehículo(s) simultáneo(s)",
    backdoorAgendaMaxInstallsSetting: "Máx. Instalaciones Simultáneas:",
    backdoorAgendaMaxInstallsSaved: "Capacidad máxima de instalaciones actualizada a {count} vehículo(s).",
    serviceCollisionCapacityReached: "Capacidad máxima del taller alcanzada ({max} vehículos simultáneos en ese horario). Por favor selecciona otro horario.",
    serviceEstimatedInstallationBadge: "Tiempo estimado de instalación: {hours}h (+30m margen técnico)",
    serviceEstimatedInstallationDesc: "Suma de los productos seleccionados en tu pedido",
    serviceCarryoverNextDayBadge: "Continúa al día siguiente: 8:00 AM - {time}",
    backdoorAgendaDrivingTime: "Tiempo de viaje estimado",
    backdoorAdjustTimeModalTitle: "Ajustar Tiempo de Instalación & Hoja de Horarios",
    backdoorAdjustTimeSheet: "Hoja de Horarios (8:00 AM - 8:00 PM)",
    backdoorAdjustDurationLabel: "Duración de Instalación en Taller",
    backdoorAdjustSaveBtn: "Guardar Horario & Duración",
    backdoorMasterOnlyCapacity: "Solo usuarios con permisos de nivel Master pueden modificar la capacidad de instalaciones simultáneas.",
    orderAlertAdvancedTitle: "Pedido #{orderNumber} Avanzó",
    orderAlertUpdatedTitle: "Pedido #{orderNumber} Actualizado",
    orderAlertAdvancedDesc: "Tu pedido avanzó a la etapa: {stage}",
    orderAlertUpdatedDesc: "El estado de tu pedido ha sido actualizado.",
    orderAlertRejectedTitle: "Comprobante Rechazado - Pedido #{orderNumber}",
    orderAlertRejectedDesc: "Tu comprobante de pago fue rechazado. Haz clic para corregir el pago y continuar con tu pedido.",
    orderAlertFixPaymentBtn: "Corregir Pago",
    orderAlertViewOrderBtn: "Ver Pedido",
    orderAlertDismissBtn: "Cerrar",
    orderAlertProgramServiceTitle: "¡Programa tu Servicio! - Pedido #{orderNumber}",
    orderAlertProgramServiceDesc: "Tus repuestos ya están listos en el taller. Por favor programa la fecha y hora de tu servicio para continuar.",
    orderAlertProgramServiceBtn: "Programar Servicio",

    bannerTitle: "¿Buscas piezas para un vehículo específico? Configura tu modelo para verificar compatibilidad exacta.",
    bannerTitleShort: "¿Buscas piezas para tu modelo?",
    bannerAction: "Configurar Vehículo",
    bannerActionShort: "Configurar",
    bannerDismiss: "Cerrar",

    heroCategory: "Centro Técnico Especializado en Costa Rica",
    heroTitle: "ZXZ MODS PERFORMANCE",
    heroSubtitle: "Lleva tu CFMOTO, Can-Am o Polaris al Siguiente Nivel",
    heroLearnMore: "Conocer Más",
    heroBuyNow: "Cotizar Ahora",
    heroQuoteBtn: "Solicitar Cotización",
    videoPlaceholderNote: "Espacio reservado para video de alta definición (Próximamente)",
    heroBadge: "Taller & Concierge UTV/ATV Costa Rica",
    heroHighlight: "ZxZ Mods",
    heroDescription: "Importación directa de repuestos y accesorios desde Estados Unidos. Disponibilidad real, asesoría técnica experta, instalación en taller y garantías claras de mano de obra.",
    heroExploreBtn: "Explorar Marcas & Modelos",
    heroWhatsAppBtn: "Cotización Rápida por WhatsApp",
    heroMetric1Label: "Garantía Bolt-On",
    heroMetric1Value: "90 Días",
    heroMetric2Label: "Descuento en 5+ Installs",
    heroMetric2Value: "15% OFF",
    heroMetric3Label: "Garantía Repro ECU",
    heroMetric3Value: "De por Vida",

    brandsTitle: "Explora por Marca",
    brandsSubtitle: "Accede a repuestos verificados y combos diseñados exclusivamente para tu plataforma.",
    brandsViewModels: "Ver Modelos Compatibles",
    brandsSectionTitle: "Marcas & Modelos Principales",
    brandsSectionSubtitle: "Accede a piezas garantizadas, paquetes de preparación y cotizaciones para tu plataforma específica.",
    cfmotoSpecialityNote: "Nuestra especialidad #1 en Costa Rica: Preparación de motores, reprogramación y fajas reforzadas para CFMOTO ZForce, CForce y UForce.",
    exploreModels: "Explorar Modelos",
    quoteThisBrand: "Cotizar Piezas",
    dealerBrandsAriaLabel: "Marcas oficiales y distribuidas",
    dealerBrandsTooltip: "Ver productos de {brand}",

    combosTitle: "Combos & Kits Listos para Instalar",
    combosSubtitle: "Paquetes combinados con descuento especial en partes y opción de instalación en nuestro taller.",
    combosIncludes: "Componentes incluidos en este combo:",
    comboInstallAddon: "Incluir instalación profesional en Taller ZxZ",
    comboAddToCart: "Agregar Combo al Carrito",
    comboOriginalPrice: "Precio individual:",
    comboDiscountBadge: "Ahorro Especial",
    combosSearchPlaceholder: "Buscar combos por nombre, pieza o componente...",
    combosAllCategories: "Todos",
    combosCategoryPerformance: "Rendimiento",
    combosCategoryRings: "Aros & Llantas",
    combosCategoryLights: "Iluminación",
    combosNoResults: "No se encontraron combos con los filtros seleccionados.",
    combosActiveVehicleNotice: "Vehículo activo:",
    combosChangeVehicle: "Cambiar",
    combosSelectVehicle: "Seleccionar vehículo",
    combosIncludesSummary: "Incluye",
    comboViewDetails: "Ver Combo",
    comboBreadcrumb: "Combos & Kits",
    comboNotFound: "Combo no encontrado",
    comboNotFoundDesc: "El combo solicitado no existe o fue descontinuado.",
    comboBackToCombos: "Volver al Catálogo de Combos",
    comboRelatedTitle: "Otros Combos Recomendados",
    comboRelatedSubtitle: "Explora paquetes adicionales para potenciar y equipar tu UTV.",
    comboSavings: "Ahorras",
    comboFitmentVerified: "Calce y compatibilidad garantizados con tu vehículo",
    comboFitmentPrompt: "Configura tu vehículo en el Garaje para validar compatibilidad exacta",

    performanceTitle: "Paquetes de Rendimiento Stage",
    performanceSubtitle: "Desde fiabilidad en ruta hasta configuraciones de competencia extrema con banco de pruebas.",
    stageBadge: "Stage",
    stageHpGain: "Ganancia de Potencia",
    stageTorqueGain: "Torque Estimado",
    stageDynoIncluded: "Incluye Calibración en Dyno",
    stageSelectBtn: "Cotizar / Agregar Stage",

    viewCombosBtn: "Ver Pantalla de Combos",
    viewPerformanceBtn: "Ver Paquetes de Rendimiento",
    requestQuoteTitle: "Cotizaciones a la Medida",
    requestQuoteSubtitle: "Elige tu modelo exacto y recibe una proforma detallada con costos de importación, impuestos y opción de instalación.",

    garageModalTitle: "Asegura el Calce Perfecto para tu Vehículo",
    garageModalSubtitle: "Solo te lo pediremos esta vez. Guardaremos tu modelo en 'Mi Garaje' para validar la compatibilidad de cada pieza antes de agregarla al carrito.",
    garageSelectYear: "1. Selecciona el Año",
    garageSelectBrand: "2. Selecciona la Marca",
    garageSelectModel: "3. Selecciona el Modelo",
    garageSaveBtn: "Guardar Vehículo y Continuar",
    garageCancelBtn: "Seguir Explorando",
    garageFirstTimeNotice: "Te pedimos tu vehículo solo la primera vez para garantizar que todo calce a la perfección.",
    garageFitSuccess: "Compatible con tu",
    garageFitWarning: "Verificación de calce requerida para",

    garageFleetTitle: "Mi Garaje SxS & ATV",
    garageFleetSubtitle: "Administra tu flota de vehículos recreativos y utilitarios para verificar calce y compatibilidad directa en el catálogo.",
    garageRegisteredCounter: "Vehículos Registrados",
    garageMaxNotice: "Capacidad máxima alcanzada en tu garaje. Elimina un vehículo para registrar uno nuevo.",
    garageRegisterNewBtn: "Registrar Nuevo Vehículo",
    garageActiveBadge: "Vehículo Activo para Calce",
    garageSetActiveBtn: "Activar para Calce",
    garageActiveStatus: "Activo en Sesión",
    garageDeleteBtn: "Eliminar",
    garageDeleteConfirm: "¿Seguro que deseas eliminar este vehículo de tu garaje?",
    garageEmptyTitle: "Tu Garaje está Vacío",
    garageEmptySubtitle: "No tienes ningún vehículo SxS o ATV registrado. Agrega tu máquina para validar compatibilidad y desbloquear recomendaciones específicas de rendimiento.",
    garageEmptyCta: "Registrar Mi Primer Vehículo",
    garageViewCompatibleParts: "Ver Piezas Compatibles",
    garageManageBreadcrumb: "Garaje",
    garageRegisterBreadcrumb: "Registrar Vehículo",
    garageSlotsAvailable: "espacios disponibles",
    garageSlotFull: "Garaje Lleno",
    garageYearLabel: "Año del Modelo",
    garageBrandLabel: "Marca / Fabricante",
    garageModelLabel: "Modelo / Plataforma",
    garageCategoryLabel: "Categoría",
    garageNicknameField: "Apodo o Nombre de tu Máquina (Opcional)",
    garageNicknamePlaceholder: "Ej: La Bestia Roja, X3 Turbo Baja Edition...",
    garageColorField: "Color / Gráficos (Opcional)",
    garageColorPlaceholder: "Ej: Rojo / Negro, Ghost Grey, Desert Tan...",
    garageNotesField: "Modificaciones o Notas Adicionales (Opcional)",
    garageNotesPlaceholder: "Ej: Jaula personalizada, aros beadlock 15\", winch...",
    garageRegisterSuccessMsg: "Vehículo registrado correctamente en tu garaje.",
    garageRegisterErrorLimit: "Has alcanzado la capacidad máxima de tu garaje. Por favor elimina uno de tus vehículos antes de continuar.",
    garageVideogameStageTitle: "Configurador ZxZ",
    garageVideogameStageSubtitle: "Visualización del emblema oficial y especificaciones de la marca.",
    garageVideogameSelectPrompt: "Selecciona las especificaciones para registrar tu vehículo",
    garageVideogameBrandFallbackBadge: "Emblema de Marca",
    garageSaveVehicleCta: "Guardar en Mi Garaje",
    garageCancelVehicleCta: "Cancelar",
    garageBackToFleetCta: "Volver a la Flota",
    garageTelemetrySpecs: "Especificaciones Técnicas",
    garageDeleteSuccess: "Vehículo eliminado del garaje.",
    garageRegisterTitle: "Configuración de Vehículo",
    garageRegisterSubtitle: "Selecciona el año, marca y modelo para dar de alta tu máquina en el garaje.",
    garageSelectPlaceholder: "-- Seleccionar --",
    garageBrandLogoSelectPrompt: "Selecciona una marca para visualizar su emblema oficial",

    workshopTitle: "Ubicación ZxZ Mods & Centro Técnico",
    workshopSubtitle: "Taller físico especializado, bahías de servicio e instalación certificada en Santa Ana, Costa Rica.",
    workshopAddressLabel: "Dirección",
    workshopHoursLabel: "Horario de Atención",
    workshopPhoneLabel: "Central Telefónica",
    workshopWhatsAppLabel: "Atención por WhatsApp",
    workshopOpenMaps: "Abrir en Google Maps",
    workshopCall: "Llamar al Taller",
    locationBadge: "Centro Técnico & Taller",
    locationTitle: "Ubicación ZxZ Mods",
    locationSubtitle: "Encuentra nuestro centro técnico y taller en Santa Ana, San José, Costa Rica.",
    locationGoogleMapsBtn: "Abrir en Google Maps",
    locationWazeBtn: "Abrir en Waze",
    locationCopyAddress: "Copiar Dirección",
    locationAddressCopied: "¡Dirección copiada!",
    locationBreadcrumb: "Ubicación",
    warrantySectionTitle: "Políticas Claras de Garantía",
    warrantySectionSubtitle: "Tu inversión protegida por escrito con términos transparentes de taller y fábrica.",
    warrantyBoltOnTitle: "Bolt-On & Eléctrico",
    warrantyBoltOnTerm: "90 Días de Mano de Obra",
    warrantyBoltOnDesc: "Garantía de 90 días en mano de obra para instalación de barras LED, winches, defensas, skid plates y accesorios eléctricos.",
    warrantyMechTitle: "Mecánica & Drivetrain",
    warrantyMechTerm: "60 Días de Mano de Obra",
    warrantyMechDesc: "Garantía de 60 días de mano de obra para clutch, fajas de transmisión, suspensión, brazos de control y tren motriz.",
    warrantyEcuTitle: "Reprogramación ECU",
    warrantyEcuTerm: "Archivo de por Vida (Lifetime)",
    warrantyEcuDesc: "Garantía vitalicia sobre el archivo de calibración y reprogramación electrónica. Cero cobertura sobre fallas mecánicas de motor.",
    warrantyProductTitle: "Garantía de Fábrica",
    warrantyProductTerm: "Garantía Oficial de Marca",
    warrantyProductDesc: "Respaldamos y tramitamos directamente la garantía original de fábrica estadounidense de cada pieza importada.",
    installationDiscountBanner: "¡Beneficio Exclusivo!: Al instalar 5 o más productos en tu orden, recibes un 15% de descuento directo en el costo total de mano de obra.",

    cartTitle: "Carrito de Compras",
    cartEmpty: "No tienes productos en tu carrito aún.",
    cartTotal: "Total de la Orden:",
    cartPartsSubtotal: "Subtotal de Partes:",
    cartLaborSubtotal: "Subtotal de Mano de Obra:",
    cartLaborDiscount: "Descuento 15% (5+ Instalaciones):",
    cartCheckout: "Pagar Ahora",
    cartPayWithCreditCard: "Pagar con Tarjeta",
    cartPayWithCreditCardBac: "Pagar con Tarjeta de Crédito (BAC Compra Click)",
    cartPayWithCreditCardDesc: "Solicita un enlace seguro BAC Compra Click por WhatsApp para pagar con tu tarjeta de crédito o débito.",
    cartPayWithTransfer: "Pagar Ahora",
    cartTransferSubtitle: "Transferencia Bancaria • SINPE Móvil",
    cartBacCompraClickNotice: "Tu pedido se creará en estado de Cotización. Se enviará el detalle completo por WhatsApp a nuestro equipo para generarte el link seguro de pago BAC Compra Click.",
    cartBacCompraClickGenerating: "Creando cotización y abriendo WhatsApp...",
    orderBacCompraClickBadge: "BAC Compra Click",
    orderBacCompraClickRequestedNotice: "El cliente solicitó enlace de pago BAC Compra Click. Envía el link generado y luego pasa la orden a Confirmación de Pago.",
    orderBacMoveToPaymentConfirmation: "Pasar a Confirmación de Pago",
    orderBacConfirmPaymentPrompt: "Ingresa el código de autorización o comprobante BAC Compra Click:",
    cartItemInstalled: "Con Instalación en Taller ZxZ",
    cartItemPartsOnly: "Solo Pieza (Sin Instalación)",
    cartViewFull: "Ver Carrito Completo",
    cartCurrencyLabel: "Moneda de Cotización",
    cartCurrencyCRC: "Colones (₡ CRC)",
    cartCurrencyUSD: "Dólares ($ USD)",
    cartLiveRateLabel: "Tipo de cambio de venta oficial divulgado por el BCCR:",
    cartLiveRateOfficial: "Banco Central de Costa Rica (BCCR)",
    cartProductAddedTitle: "¡Producto agregado a tu carrito!",
    cartProductAddedSubtitle: "Se ha añadido correctamente a tu selección actual.",
    cartContinueShopping: "Seguir Explorando Piezas",
    cartClearAll: "Vaciar Carrito",
    cartClearConfirm: "¿Deseas eliminar todos los artículos de tu carrito?",
    cartRemoveConfirmTitle: "¿Eliminar del carrito?",
    cartRemoveConfirmMessage: "¿Deseas eliminar este producto de tu carrito de compras?",
    cartRemoveConfirmAction: "Eliminar",
    cartRemoveConfirmCancel: "Cancelar",
    productInCart: "en el carrito",
    cartOrderSummary: "Resumen de la Orden",
    cartVehicleCompatibilityTitle: "Vehículo en Mi Garaje",
    cartDiscountPerkActive: "✓ ¡15% de descuento en mano de obra aplicado por 5+ instalaciones!",
    cartDiscountPerkPrompt: "Agrega {count} producto(s) más con instalación para recibir 15% OFF en mano de obra.",
    cartUnitPrice: "Precio Unitario",
    cartQuantity: "Cantidad",
    cartInstallation: "Instalación en Taller",
    cartSubtotal: "Subtotal",
    cartActions: "Acciones",
    cartEstimatedTotal: "Total Estimado",
    cartWorkshopPerk: "Instalación profesional certificada en taller ZxZ Mods",
    cartWarrantyPerk: "Garantía oficial de fábrica en todas las piezas",
    cartShippingPerk: "Envíos directos a todo el país o retiro inmediato en taller",
    cartProductBrandLabel: "Marca:",
    cartCompatibleModelsLabel: "Modelos compatibles:",
    cartCompatibleWithGarage: "Compatible con tu {vehicle}",
    cartNotVerifiedForGarage: "No es compatible con tu {vehicle}",
    cartGarageAdvicePrompt: "💡 Consejo: Inscribe tu SxS en Mi Garaje como ventaja para verificar compatibilidad exacta y filtrar accesorios.",
    cartGarageAdviceBtn: "Inscribir mi SxS",
    cartHomeInstallationEligible: "Aplica para Instalación a Domicilio",
    cartHomeInstallationIneligible: "Solo en taller ZxZ (No aplica a domicilio)",
    cartHomeInstallationCheckoutTitle: "Servicio a Domicilio Disponible",
    cartHomeInstallationCheckoutDesc: "Tu orden incluye piezas que califican para instalación técnica a domicilio o en tu finca dentro de Costa Rica.",
    cartHomeInstallationCheckoutBadge: "Apto para instalación a domicilio",
    cartItemFreeInstallation: "Instalación Gratis",
    cartFree: "Gratis",
    cartItemPaidInServices: "Se paga al seleccionar un servicio",
    cartItemPaidInServicesCheckout: "Instalación: Se paga al seleccionar un servicio",
    checkoutTitle: "Confirmación de Pedido & Pago",
    checkoutSubtitle: "Verifica tu orden y realiza el pago para iniciar el proceso.",
    checkoutPaymentProcedure: "Procedimiento de Pago",
    checkoutPaymentProcedureDesc: "1. Transfiere el monto total a la cuenta indicada.\n2. Sube el comprobante de pago.\n3. Acepta los términos y confirma el pedido.",
    checkoutAccountsTitle: "Cuentas Bancarias",
    checkoutUploadTitle: "Subir Comprobante",
    checkoutUploadDesc: "Arrastra tu comprobante aquí o haz clic para seleccionar (JPG, PNG).",
    checkoutTermsLabel: "Acepto los Acuerdos de Pago y Términos y Condiciones",
    checkoutConfirmBtn: "Confirmar Pago y Crear Pedido",
    checkoutConfirmingBtn: "Procesando...",
    checkoutAlertExit: "Tienes un pago en proceso. ¿Seguro que quieres salir sin confirmar tu pedido?",
    checkoutTermsModalTitle: "Acuerdos de Pago",
    checkoutTermsModalContent: "ZxZ Mods no se hace responsable por transferencias realizadas a cuentas equivocadas, montos erróneos o comprobantes falsos o ilegibles enviados por el usuario. Al proceder, confirmas que la información del pago es verídica y eximes a la empresa de cualquier error en el procedimiento de pago.",
    checkoutPhoneLabel: "Número de Teléfono / WhatsApp",
    checkoutPhonePlaceholder: "Ej: +506 8888 8888",
    checkoutPhoneDesc: "Para contactarte cuando el pedido esté listo para entrega o instalación.",

    // Factura Electrónica & Order Discounts
    orderDiscountApplied: "Descuento Aplicado",
    orderFacturaTaxLabel: "IVA 13% (incluido en el total)",
    orderFacturaDetailsTitle: "Datos de Facturación Electrónica (Hacienda CR)",
    orderFacturaCompany: "Razón Social / Empresa",
    orderFacturaId: "Cédula",
    orderFacturaEmail: "Correo de Facturación",
    orderFacturaPhone: "Teléfono de Facturación",
    orderFacturaEconomicActivity: "Actividad Económica",
    orderFacturaNotes: "Dirección / Notas Fiscales",
    checkoutFacturaToggle: "Solicitar Factura Electrónica (Hacienda CR)",
    checkoutFacturaSubtitle: "Emisión tributaria oficial válida ante Hacienda. El 13% de IVA ya está incluido en los precios, sin recargos adicionales.",
    checkoutFacturaCompanyLabel: "Razón Social o Nombre Legal",
    checkoutFacturaCompanyPlaceholder: "Ej: Mi Empresa S.A. o Nombre Completo",
    checkoutFacturaIdTypeLabel: "Tipo de Cédula",
    checkoutFacturaIdTypeJuridica: "Cédula Jurídica",
    checkoutFacturaIdTypeFisica: "Cédula Física",
    checkoutFacturaIdTypeDimex: "DIMEX",
    checkoutFacturaIdTypeNite: "NITE",
    checkoutFacturaIdNumberLabel: "Número de Cédula",
    checkoutFacturaIdNumberPlaceholder: "Ej: 3-101-436132 o 1-1234-0567",
    checkoutFacturaEmailLabel: "Correo Electrónico de Facturación",
    checkoutFacturaEmailPlaceholder: "facturacion@miempresa.com",
    checkoutFacturaPhoneLabel: "Teléfono de Facturación (Diferente al teléfono de entrega)",
    checkoutFacturaPhonePlaceholder: "+506 2222 2222 (Teléfono administrativo)",
    checkoutFacturaEconomicActivityLabel: "Actividad Económica (Hacienda)",
    checkoutFacturaEconomicActivityPlaceholder: "Ej: 453001 - Venta de partes y repuestos para vehículos",
    checkoutFacturaDetailsLabel: "Dirección Fiscal / Señas Adicionales (Opcional)",
    checkoutFacturaDetailsPlaceholder: "Provincia, cantón, distrito o detalles tributarios...",
    checkoutFacturaTaxBadge: "IVA 13% Ya Incluido",
    checkoutFacturaRequiredError: "Por favor completa todos los campos requeridos de Factura Electrónica.",
    checkoutFacturaSamePhoneError: "El teléfono de facturación debe ser diferente al teléfono de contacto del pedido.",

    // Add-To-Cart Recommendations Modal
    cartAddedModalTitle: "¡Producto Agregado al Carrito!",
    cartAddedModalFrequentlyBought: "Frecuentemente Comprados Juntos",
    cartAddedModalFrequentlyBoughtDesc: "Optimiza tu configuración con estas piezas compatibles recomendadas:",
    cartAddedModalAddToCart: "Agregar al Carrito",
    cartAddedModalAdded: "Agregado",
    cartAddedModalViewCart: "Ver Carrito",
    cartAddedModalCheckout: "Proceder al Pago",
    cartAddedModalContinue: "Seguir Comprando",

    // Smart Pre-Checkout Optimizer
    smartCheckoutModalTitle: "Optimización Inteligente de tu Pedido",
    smartCheckoutModalSubtitle: "Detectamos mejores opciones de compra y ahorros disponibles antes de pagar.",
    smartCheckoutComboBadge: "¡Ahorro de Combo Detectado!",
    smartCheckoutComboSwapBtn: "Cambiar Piezas por el Combo y Ahorrar",
    smartCheckoutComboSwappedSuccess: "¡Piezas actualizadas al combo con éxito!",
    smartCheckoutCurrentParts: "Piezas individuales en tu carrito:",
    smartCheckoutComboPrice: "Precio del Combo Oficial:",
    smartCheckoutYouSave: "Ahorras en este pedido:",
    smartCheckoutRelatedTitle: "Piezas Complementarias Sugeridas",
    smartCheckoutRelatedDesc: "Basado en los artículos de tu carrito, nuestros especialistas recomiendan agregar:",
    smartCheckoutContinueBtn: "Continuar al Pago",
    smartCheckoutSkipBtn: "Omitir y continuar al pago",
    smartCheckoutBannerNotice: "💡 Optimización Disponible: Tienes piezas que califican para el Combo",
    smartCheckoutBannerAction: "Ver Oferta y Aplicar Descuento",
    cartQuoteViaWhatsapp: "Cotizar Pedido por WhatsApp",
    whatsappConciergePrompt: "¿Buscas una pieza específica de Estados Unidos o tienes dudas sobre compatibilidad?",
    whatsappQuoteTitle: "Chatea con un Asesor Técnico ZxZ",

    loadingCatalog: "Cargando catálogo dinámico...",
    loadingVehicleData: "Consultando datos de compatibilidad...",
    systemBoot: "INICIANDO SISTEMAS ZXZ MODS...",
    enterSite: "INGRESAR AL SITIO",
    skipIntro: "Saltar Intro",
    scrollDown: "Desliza hacia abajo",

    productsTitle: "Catálogo de Productos & Piezas SXS",
    productsSubtitle: "Piezas de alto rendimiento probadas en Costa Rica con garantía de taller mecánico y soporte de instalación profesional.",
    productsSearchPlaceholder: "Buscar por pieza, categoría, marca o modelo SXS...",
    productsAllCategories: "Todas las Categorías",
    productsAllBrands: "Todas las Marcas",
    productsAllVehicles: "Todos los Modelos SXS",
    productsFilterCategory: "Categoría",
    productsFilterBrand: "Marca",
    productsFilterVehicleBrand: "Marca de Vehículo",
    productsAllVehicleBrands: "Todos los Vehículos",
    productsFilterModelCategory: "Categoría en Marca",
    productsAllModelCategories: "Todas las Categorías",
    productsBrandCategoriesHeading: "Categorías y Familias",
    productsModelsInCategory: "Modelos",
    productsFilterDistributorBrand: "Marca Fabricante",
    productsAllDistributorBrands: "Todas las Marcas",
    productsFilterInStock: "En Stock",
    productsFilterDiscounted: "En Oferta",
    productsFilterCompatibility: "Compatibilidad",
    productsFitMyGarage: "Compatible con mi Garaje",
    productsSortBy: "Ordenar por",
    productsSortRelevant: "Relevancia",
    productsSortPriceAsc: "Precio: Menor a Mayor",
    productsSortPriceDesc: "Precio: Mayor a Menor",
    productsSortRating: "Mejor Calificados",
    productsPricePiece: "Precio total de venta:",
    productsPriceIncludesIva: "IVA incluido",
    productsPriceWithIvaFull: "IVA incluido (13%)",
    checkoutPricesIncludeIvaNotice: "Todos los precios incluyen el 13% de IVA conforme a la legislación de Costa Rica.",
    devProductIvaTitle: "IVA (13% - Impuesto sobre el Valor Agregado)",
    devProductIvaHelp: "Al crear o editar el producto se calcula automáticamente el 13% de IVA sobre el subtotal y se suma para obtener el Precio Total Verdadero (T_price). En la tienda y checkout se indica que el precio ya incluye el IVA.",
    productsInstallationFree: "¡Instalación gratis en este producto!",
    productsInstallationAddon: "Instalación disponible en taller ZxZ",
    productsCurrencyCheckoutNote: "Precio en USD disponible en checkout",
    productsRequirementsNotice: "Requisito Recomendado",
    productsUniversalFit: "Compatible con todos los SXS / Universal",
    productsFitsSxs: "Compatible con:",
    productsAddToCart: "Agregar al Carrito",
    productsQuoteWhatsapp: "Cotizar por WhatsApp",
    productsNoResults: "No se encontraron productos coincidentes",
    productsNoResultsDesc: "Intenta cambiar el término de búsqueda o limpia los filtros seleccionados.",
    productsClearFilters: "Limpiar Filtros",
    productsCount: "productos disponibles",
    productAudioSample: "Muestra de Sonido del Escape",
    productVideoSample: "Video Demostrativo del Producto",
    productListenAudio: "Sonido del escape en espera (Idle Sound)",
    productAudioIdle: "Sonido en Espera (Idle)",
    productAudioRev: "Sonido al Acelerar (Rev)",
    productAudioSelectTrack: "Seleccionar Muestra de Sonido:",
    productAudioErrorNotice: "No se pudo reproducir este clip de audio.",
    productNoReviews: "Sin reseñas aún",
    productFitCheckTitle: "Verificación para tu Vehículo",
    productFitCheckCompatible: "¡Calce confirmado para tu",
    productFitCheckIncompatible: "No es compatible con tu",
    productFitCheckDirectFit: "Esta pieza calza directamente en tu vehículo sin modificaciones.",
    productFitCheckPlatformNote: "Este accesorio está diseñado específicamente para plataformas",
    productFitCheckNoVehicle: "¿No estás seguro si calza en tu vehículo? Configura tu modelo en 'Mi Garaje' para verificar compatibilidad exacta antes de realizar tu pedido.",
    productFitCheckConfigureBtn: "Configurar Vehículo en Garaje",
    productFitCheckChangeBtn: "Cambiar",
    productRequirementsShelfTitle: "Componentes Requeridos para Funcionamiento",
    productRequirementsShelfSubtitle: "Piezas necesarias recomendadas para el correcto funcionamiento del vehículo.",
    productRelatedShelfTitle: "Productos Relacionados",
    productRelatedShelfSubtitle: "Mejoras recomendadas, reprogramaciones y componentes compatibles.",
    productModelYearCompatTitle: "Compatibilidad por Modelo y Año",
    productModelYearCompatSubtitle: "Verifica los modelos, rangos de años y versiones de vehículos SXS confirmados para este accesorio.",
    productMake: "Marca",
    productModel: "Modelo",
    productYears: "Años Compatibles",
    productTrim: "Versión / Trim",
    productFitmentType: "Tipo de Calce",
    productFitmentNotes: "Notas de Instalación",
    productVehicleMatches: "Calce confirmado para tu vehículo en Garaje",
    productVehicleAutoSelected: "Vehículo registrado auto-seleccionado",
    productUniversalModelYear: "Universal: Diseñado y verificado para todos los modelos y años SXS / UTV / ATV.",
    productViewYearFitment: "Ver modelos y años compatibles",

    // Supplier Availability Projection
    supplierStockInStock: "En Stock",
    supplierStockPreOrder: "Preventa",
    supplierStockLowStock: "Últimas Unidades",
    supplierStockOutOfStock: "Agotado Temporalmente",
    supplierStockUnavailable: "No Disponible",
    supplierVerifiedBadge: "Verificado con el fabricante",
    supplierLeadTimeText: "Entrega estimada a Costa Rica: {min}-{max} días hábiles",
    supplierPreOrderNotice: "Artículo en preventa. Tu pedido se reservará con prioridad al ingresar inventario.",
    supplierReserveQuotationBtn: "Solicitar Cotización de Reserva",
    supplierReserveQuotationNotice: "Este producto se encuentra actualmente agotado en fábrica. Puedes generar una cotización de reserva sin compromiso para apartarlo en cuanto se restablezca el inventario.",

    // Customer Verified Reviews System (Spanish)
    reviewsSectionTitle: "Reseñas de Clientes Verificados",
    reviewsSectionSubtitle: "Calificaciones reales de clientes que completaron la compra e instalación de este artículo.",
    reviewsVerifiedBuyerBadge: "Comprador Verificado",
    reviewsVerifiedBuyerNotice: "Has completado la compra de este artículo. ¡Comparte tu experiencia con la comunidad!",
    reviewsCompletedOrderOnlyNotice: "Solo compradores con un pedido completado y entregado pueden calificar este producto o combo.",
    reviewsWriteReviewBtn: "Escribir Reseña",
    reviewsEditReviewBtn: "Editar Mi Reseña",
    reviewsFormTitle: "Calificar Producto / Combo",
    reviewsFormEditTitle: "Actualizar Tu Calificación",
    reviewsRatingLabel: "Tu Calificación general",
    reviewsTitleLabel: "Título de tu reseña (opcional)",
    reviewsTitlePlaceholder: "Ej: Excelente respuesta en el motor y ajuste perfecto",
    reviewsCommentLabel: "Tu Opinión o Reseña",
    reviewsCommentPlaceholder: "Cuéntanos sobre el rendimiento, durabilidad, calidad de materiales o instalación...",
    reviewsSubmitBtn: "Publicar Reseña Verificada",
    reviewsSaveEditBtn: "Guardar Cambios",
    reviewsCancelBtn: "Cancelar",
    reviewsSubmitting: "Enviando reseña...",
    reviewsSuccessToast: "¡Reseña publicada con éxito! Gracias por tu aporte.",
    reviewsErrorToast: "Ocurrió un error al guardar tu reseña. Por favor intenta de nuevo.",
    reviewsEmptyList: "Este artículo aún no cuenta con reseñas publicadas. Una vez que tu pedido sea entregado y completado, podrás dejar tu calificación aquí.",
    reviewsLoginPrompt: "Inicia sesión con tu cuenta para comprobar si tienes órdenes completadas de este artículo.",
    reviewsRatingOutOfFive: "de 5 estrellas",
    reviewsAverageRating: "Calificación Promedio",
    reviewsBasedOn: "basado en",
    reviewsFilterAll: "Todas las calificaciones",
    reviewsMyReviewBadge: "Tu Calificación",
    orderLeaveReviewBtn: "Calificar Artículo",
    orderEditReviewBtn: "Editar Calificación",
    supplierCartPreOrderChip: "Preventa",
    supplierCartInStockChip: "En Stock ({min}-{max} d)",
    supplierCartOutOfStockChip: "Agotado",
    supplierCartOutOfStockWarning: "Este producto se encuentra temporalmente agotado. Te sugerimos solicitar una cotización de reserva para apartarlo con prioridad.",
    supplierLastCheckedLabel: "Verificado hace",
    supplierCheckingLive: "Consultando disponibilidad en vivo...",

    // Backdoor / Stealth Dev-Console
    devConsoleTitle: "Consola de Desarrollo ZxZ",
    devConsoleSubtitle: "Terminal de Operaciones, Catálogo, Descuentos y Órdenes",
    devRoleMaster: "Master (Acceso Total)",
    devRoleStaff: "Staff Técnico (Operativo)",
    devCostShipping: "Costo de Envío",
    devCostInstallation: "Costo de Instalación",
    devCostPickup: "Costo de Retiro en Taller",
    devCostParts: "Subtotal de Repuestos",
    devOrderProgression: "Progresión del Pedido",
    devStatusPending: "Pendiente",
    devStatusPartsOrdered: "Piezas Pedidas",
    devStatusInTransit: "En Tránsito a CR",
    devStatusReadyForInstall: "Listo para Instalación",
    devStatusInProgress: "En Taller / Instalación",
    devStatusCompleted: "Completado y Entregado",
    devStatusCancelled: "Cancelado",
    devDiscountAdd: "Aplicar Descuento",
    devDiscountPercentage: "Descuento en Porcentaje (%)",
    devDiscountFixed: "Descuento Fijo (₡)",
    devDiscountReason: "Motivo del Descuento",
    devBasePriceLocked: "Precio Base Bloqueado (Exclusivo Master)",
    devInstallationCostEditable: "Costo de Instalación Editable por Staff",
    devAuditHistory: "Historial de Auditoría (6 Meses)",
    devAuditActor: "Usuario",
    devAuditAction: "Acción Registrada",
    devAuditTimestamp: "Fecha y Hora",
    devAuditOldValue: "Valor Anterior",
    devAuditNewValue: "Nuevo Valor",
    devAuthEmail: "Correo de Acceso",
    devAuthPasskey: "Contraseña / Llave de Seguridad",
    devAuthLoginBtn: "Autenticar Terminal",
    devAuthAuthenticating: "Verificando Credenciales...",
    devAuthLogoutBtn: "Cerrar Sesión Terminal",
    devAuthTerminalLocked: "Terminal Bloqueada por Intentos Fallidos",
    devAuthSessionActive: "Sesión Criptográfica Activa",
    devAuthSecuredConnection: "Conexión Segura Encriptada",
    devOrdersTitle: "Gestión de Pedidos & Progresión de Partes",
    devCreateOrderTitle: "Crear Pedido Manual para Cliente",
    devCatalogTitle: "Gestión de Catálogo (Productos & Combos)",
    devAuditTitle: "Bitácora de Auditoría (Historial 6 Meses)",
    devStaffTitle: "Control de Acceso & Cuentas de Personal",
    devSearchPlaceholder: "Buscar por # orden, nombre o teléfono...",
    devFilterAll: "Todos los Estados",
    devNoOrders: "No se encontraron pedidos en este criterio.",
    devSaveSuccess: "Cambios guardados correctamente en la base de datos.",
    devSaveError: "Ocurrió un error al intentar guardar los cambios.",
    devCreateProductBtn: "+ Nuevo Producto",
    devCreateComboBtn: "+ Nuevo Combo",
    devCreateStaffBtn: "+ Nuevo Perfil Staff",
    devUploadImage: "Subir Imagen",
    devUploading: "Procesando subida...",
    devSelectCustomer: "Vincular a Cuenta de Usuario Registrado",
    devGuestCustomer: "Cliente en Taller / Sin Registro",
    devDeliveryType: "Tipo de Entrega / Servicio",
    devHomeInstallation: "Instalación a Domicilio",
    devStorePickup: "Retiro en Taller (Pozos de Santa Ana)",
    devShippingCR: "Envío Encomienda / GAM",
    devDiscountLimitAlert: "Personal técnico limitado a un máximo de 15% de descuento.",
    orderStatusPaymentConfirmation: "Confirmación de Pago",
    orderDeleteBtn: "Eliminar",
    orderDeleteQuoteConfirmTitle: "Eliminar Cotización",
    orderDeleteQuoteConfirmPrompt: "¿Estás seguro de eliminar esta cotización? Esta acción es permanente.",
    orderDeleteMasterPasswordRequired: "Para eliminar un pedido en Confirmación de Pago o posterior se requiere autorización con contraseña Master.",
    orderMasterPasswordLabel: "Contraseña Master Requerida",
    orderMasterPasswordPlaceholder: "Ingresa la contraseña de usuario Master...",
    orderDeleteSuccessMsg: "Pedido eliminado correctamente.",
    orderEditQuoteTitle: "Editar Cotización (Estado Inicial)",
    orderManageTitle: "Gestión de Pedido, Mensajes & Transporte",
    orderHasNotesBadge: "Nota / Mensaje",
    orderImportantNotesLabel: "Mensajes e Información Importante",
    orderAddNoteBtn: "Agregar Mensaje / Nota",
    orderSelectTransportService: "Servicio de Movilidad & Transporte",
    orderTransportStorePickup: "Retiro en Taller (Pozos, Santa Ana)",
    orderTransportHomeService: "Instalación / Servicio a Domicilio",
    orderTransportUtvPickup: "Recogida de UTV en Grúa / Taller",
    orderTransportShipping: "Envío por Encomienda",
    devYearFromLabel: "Año Desde",
    devYearToLabel: "Año Hasta",
    devYearRangeTitle: "Rango de Años Compatibles",
    devUploadVideoBtn: "Subir Video",
    devUploadAudioBtn: "Subir Audio HD",
    devMediaUploadSection: "Subida Directa de Multimedia (Imágenes, Videos y Audios HD)",
    comboInstallationIncluded: "Incluida",
    comboInstallationBadge: "Instalación Incluida",
    productEliminateBtn: "Eliminar Producto",
    productEliminateConfirmTitle: "Eliminar Producto Permanentemente",
    productEliminateConfirmPrompt: "Esta acción eliminará de forma irreversible el producto de la base de datos y catálogo. Requiere confirmación de Master.",
    productEliminateSuccess: "Producto eliminado definitivamente del catálogo.",
    productArchiveBtn: "Archivar",
    productUnarchiveBtn: "Desarchivar",
    productArchiveConfirmPrompt: "¿Deseas archivar este producto? Dejará de mostrarse a los clientes en la tienda.",
    productUnarchiveConfirmPrompt: "¿Deseas desarchivar este producto y reactivarlo en la tienda pública?",
    productFilterAll: "Todos",
    productFilterActive: "Activos",
    productFilterArchived: "Archivados",
    productFindArchivedBtn: "Ver Archivados",
    comboEliminateBtn: "Eliminar Combo",
    comboEliminateConfirmTitle: "Eliminar Combo Permanentemente",
    comboEliminateConfirmPrompt: "Esta acción destruirá el combo de forma irreversible del catálogo. Se requiere confirmación de contraseña de Master.",
    comboEliminateSuccess: "Combo eliminado permanentemente del catálogo.",
    comboArchiveBtn: "Archivar",
    comboUnarchiveBtn: "Desarchivar",
    comboArchiveConfirmPrompt: "¿Estás seguro de que deseas archivar este combo? No será visible para los clientes en la tienda.",
    comboUnarchiveConfirmPrompt: "¿Deseas reactivar este combo para que vuelva a estar visible en la tienda pública?",
    comboFilterAll: "Todos",
    comboFilterActive: "Activos",
    comboFilterArchived: "Archivados",
    comboFindArchivedBtn: "Ver Archivados",
    orderPaymentProofTitle: "Comprobante de Pago",
    orderPaymentProofBadge: "Comprobante Adjunto",
    orderNoPaymentProofBadge: "Sin Comprobante",
    orderViewPaymentProofBtn: "Ver Comprobante",
    orderUploadPaymentProofBtn: "Subir Comprobante",
    orderPaymentProofModalTitle: "Comprobante de Pago del Cliente",
    orderPaymentProofModalSubtitle: "Verificación de transferencia y fondos para confirmación del pedido",
    orderPaymentProofEmpty: "El cliente aún no ha adjuntado un comprobante digital para esta orden.",
    orderPaymentProofVerified: "Comprobante cargado para validación de fondos",
    orderPaymentProofOpenFull: "Pantalla Completa",
    orderPaymentProofNewTab: "Abrir en Nueva Pestaña",
    orderPaymentProofCurrencyLabel: "Moneda de Pago Registrada",
    orderPaymentProofAttachStaffBtn: "Adjuntar / Actualizar Comprobante (Staff)",
    orderServicePaymentProofTitle: "Comprobante de Pago de Servicio / Transporte",
    orderServicePaymentProofSubtitle: "Comprobante del costo de transporte, flete o agendamiento del servicio",
    orderInstallationPaymentProofTitle: "Comprobante de Pago de Instalación",
    orderInstallationPaymentProofSubtitle: "Comprobante de mano de obra de instalación",
    orderPickupClientNotice: "En servicio Pick-up, este comprobante puede ser adjuntado por el cliente o gestionado por el staff.",
    orderStaffManagedNotice: "Adjuntado y verificado por el personal del taller.",
    orderAttachServiceProofBtn: "Adjuntar Comprobante de Servicio",
    orderAttachInstallationProofBtn: "Adjuntar Comprobante de Instalación",
    orderInspectProofBtn: "Inspeccionar Comprobante",
    orderDiscountTitle: "Descuento Especial en Cotización",

    orderDiscountTypePercent: "Porcentaje (%)",
    orderDiscountTypeAmount: "Monto Directo (₡)",
    orderDiscountMasterPasswordReq: "Aplicar descuentos a la orden requiere la autorización con contraseña de Master.",
    orderConfigureTransportBtn: "Configurar Servicio de Transporte",
    orderTransportConfigModalTitle: "Configuración de Servicio de Transporte y Logística",
    orderStatusNeedToGetOrder: "Requiere Ordenar Piezas (*int)",
    orderStatusShippingInUs: "En Tránsito en USA",
    orderStatusShippingToCr: "En Tránsito a Costa Rica",
    orderStatusInCostaRica: "En Costa Rica - Aduana (*int)",
    orderStatusInWarehouseCheck: "En Taller para Revisión",
    orderStatusReadyToPickUp: "Listo para Retiro",
    orderStatusProgramService: "Programar Servicio",
    orderStatusWaitingOnDelivery: "Esperando Entrega",
    orderStatusPickupDateSet: "Fecha de Retiro Programada",
    orderStatusInstalling: "Instalando Piezas",
    orderStatusReadyToSetReturnDate: "Listo para Programar Fecha de Entrega",
    orderStatusHomeInstallSet: "Instalación a Domicilio Programada",
    orderStatusReadyForPickup: "Listo para Retiro",
    orderStatusCompleted: "Completado y Entregado",
    orderStatusPaymentRejected: "Pago Rechazado",
    orderRejectedPaymentCorrectedBadge: "Pago Corregido • Revisar Pago",
    orderRejectedCorrectedStaffBannerTitle: "Pago Corregido: Comprobante Listo para Revisión",
    orderRejectedCorrectedStaffBannerDesc: "El cliente ha subido un nuevo comprobante para corregir el pago. Por favor revise el comprobante y presione 'Avanzar' para reanudar el flujo.",
    orderRejectedCorrectedCustomerTitle: "Comprobante en Revisión",
    orderRejectedCorrectedCustomerNotice: "Hemos recibido tu nuevo comprobante de pago. Nuestro equipo del taller lo está verificando para continuar con tu orden.",
    emailSubjectOrderPaymentConfirmed: "Pago Confirmado - Pedido",
    emailSubjectServicePaymentConfirmed: "Pago de Servicio Confirmado - Pedido",
    emailSubjectInstallationPaymentConfirmed: "Pago de Instalación Confirmado - Pedido",
    emailSubjectPaymentRejected: "Atención: Comprobante de Pago Rechazado - Pedido",
    emailSubjectProgramService: "Servicio Listo para Programar - Pedido",
    emailSubjectReadyForPickup: "¡Tu Pedido / Vehículo está Listo para Retiro! - Pedido",
    emailSubjectPickupDateSet: "Fecha de Recolección Programada - Pedido",
    emailSubjectOrderCompleted: "¡Pedido Completado y Entregado! - Pedido",
    emailSubjectInstallationPayment: "Pago de Instalación Pendiente - Pedido",
    emailGoogleReviewPrompt: "¿Cómo fue tu experiencia en ZxZ Mods? Califícanos en Google Maps",
    emailGoogleReviewButton: "Calificar en Google Maps ⭐⭐⭐⭐⭐",
    emailViewOrderButton: "Ver Estado del Pedido",
    emailScheduleServiceButton: "Programar Cita de Servicio",
    emailPayInstallationButton: "Pagar Instalación en Línea",
    emailUploadNewReceiptButton: "Corregir y Subir Nuevo Comprobante",
    orderRejectPaymentBtn: "Rechazar Pago",
    orderRejectServicePaymentBtn: "Rechazar Pago de Servicio",
    orderRejectInstallPaymentBtn: "Rechazar Pago de Instalación",
    orderRejectServiceModalTitle: "Rechazar Comprobante de Servicio",
    orderRejectInstallModalTitle: "Rechazar Comprobante de Instalación",
    orderAdvanceStageBtn: "Avanzar a Siguiente Etapa",
    orderRejectModalTitle: "Rechazar Comprobante de Pago",
    orderRejectReasonPrompt: "Motivo del rechazo (obligatorio para informar al cliente):",
    orderRejectReasonPlaceholder: "Ej: Comprobante ilegible, monto no coincide con la factura, número de referencia no encontrado...",
    orderRejectConfirmBtn: "Confirmar Rechazo",
    orderRejectedCustomerAlert: "Comprobante de Pago Rechazado",
    orderRejectedCustomerAdvice: "ZxZ Mods revisó tu comprobante pero no pudo validarlo. Por favor revisa el motivo indicado por el equipo técnico y vuelve a subir un comprobante válido para continuar.",
    orderReuploadProofBtn: "Volver a Subir Comprobante",
    orderConfigureReturnDelivery: "Configurar Retorno de Vehículo (50% Tarifa)",
    orderHalfRateDeliveryBadge: "50% Tarifa de Retorno",
    orderHalfRateDeliveryDesc: "Entrega de vehículo finalizada la instalación en taller a mitad de tarifa (solo regreso)",
    orderConfirmStatusTitle: "Confirmar Cambio de Estado",
    orderConfirmStatusPrompt: "¿Estás seguro de actualizar el pedido",
    orderConfirmBtn: "Confirmar y Actualizar",
    orderCancelBtn: "Cancelar",
    devProductEditMode: "Modo Edición de Producto (Vista de Tienda)",
    devProductEditModeDesc: "Editando este producto con el diseño visual oficial de la tienda pública",
    devBackToCatalog: "Volver al Catálogo",
    devSaveChanges: "Guardar Cambios",
    devSaving: "Guardando...",
    devComboEditTitle: "Editar Combo",
    devComboCreateTitle: "Nuevo Combo",
    devComboEditScreenTitle: "Editar Combo de Accesorios",
    devComboCreateScreenTitle: "Crear Nuevo Combo de Accesorios",
    productParametersTitle: "Configuración y Opciones",
    productParametersDesc: "Personaliza este producto con las especificaciones deseadas",
    productParameterOptionSelect: "Seleccionar opción",
    productParameterPriceModifier: "Ajuste de precio",
    productParameterIncluded: "Incluido",
    devParametersTitle: "Configuración de Parámetros y Variantes",
    devParametersDesc: "Configura opciones personalizables como colores, acabados, materiales o etapas que pueden modificar el precio en tiempo real.",
    devAddParameterBtn: "+ Agregar Parámetro",
    devRemoveParameterBtn: "Eliminar Parámetro",
    devParameterNameEsLabel: "Nombre del Parámetro (Español)",
    devParameterNameEnLabel: "Nombre del Parámetro (Inglés)",
    devParameterOptionsTitle: "Opciones del Parámetro",
    devAddOptionBtn: "+ Agregar Opción",
    devRemoveOptionBtn: "Eliminar Opción",
    devOptionLabelEs: "Etiqueta (Español)",
    devOptionLabelEn: "Etiqueta (Inglés)",
    devOptionPriceDelta: "Variación de Precio (+/- ₡ CRC)",
    devOptionPriceDeltaHelp: "Ingresa el ajuste en colones respecto al precio base (ej: 0 para mismo precio, 5000 para +₡5,000, o negativo).",
    devNoParametersNotice: "No hay parámetros configurados aún. Este ítem tendrá un precio único y sin variantes seleccionables.",
    devAddColorPresetBtn: "+ Preset Color (Naranja, Negro, Azul)",
    devOptionColorLabel: "Color Visual",
    devOptionImageLabel: "Foto de Variante (Opcional)",
    devOptionImageUpload: "Subir Foto",
    devOptionNoColor: "Sin Color",
    devOptionSupplierUrlLabel: "URL del Proveedor para esta opción (supplierUrl):",
    devAddProductLinkingPresetBtn: "+ Vincular Productos (Amazon)",
    devParameterTypeLabel: "Tipo de Parámetro:",
    devParamTypeButton: "Botones Estándar",
    devParamTypeColor: "Colores con Muestra",
    devParamTypeProductLinking: "Vinculación de Productos (Estilo Amazon)",
    devSelectLinkedProduct: "Seleccionar producto a vincular...",
    devLinkedProductBadge: "Producto Vinculado",
    devLinkedProductDesc: "Cambia imágenes, precio y especificaciones sin salir de la pantalla.",
    productLinkedUpgradesTitle: "Edición / Versión del Producto:",
    devComboIncludedProducts: "Productos Incluidos en el Combo",
    devComboSearchProductPlaceholder: "Buscar producto del catálogo para agregar al combo...",
    devComboAddProduct: "Agregar al Combo",
    devComboEditProductLink: "Editar Producto",
    devComboNoProductsSelected: "No hay productos seleccionados aún. Busca productos arriba para vincularlos al combo.",
    devComboUniqueProductTitle: "Producto / Servicio Único del Combo",
    devComboUniqueProductDesc: "Crea un producto o servicio exclusivo para este combo (ej: ajuste completo de suspensión según estilo de manejo, peso y accesorios). No todos los combos requieren este producto único.",
    devComboUniqueProductEnableToggle: "Incluir Producto / Servicio Único en este Combo",
    devComboUniqueProductTemplates: "Plantillas Rápidas:",
    devComboUniqueProductTemplateSuspension: "Ajuste de Suspensión (Estilo, Peso, Accesorios)",
    devComboUniqueProductTemplateECU: "Reprogramación ECU / Tuning",
    devComboUniqueProductTemplateCustom: "Personalizado en Blanco",
    devComboUniqueProductNameEs: "Nombre del Producto/Servicio (Español)",
    devComboUniqueProductNameEn: "Nombre del Producto/Servicio (English)",
    devComboUniqueProductBadgeEs: "Insignia / Badge (Español)",
    devComboUniqueProductBadgeEn: "Insignia / Badge (English)",
    devComboUniqueProductDescEs: "Descripción Detallada (Español)",
    devComboUniqueProductDescEn: "Descripción Detallada (English)",
    devComboUniqueProductPrice: "Valor / Precio Incluido en el Combo (₡)",
    devComboUniqueProductImage: "Imagen del Producto/Servicio Único",
    devComboUniqueProductUploadImage: "Subir Imagen",
    devComboUniqueProductFieldsTitle: "Campos de Personalización Requeridos al Comprador",
    devComboUniqueProductFieldsSubtitle: "Define los datos que el cliente debe especificar al comprar este combo (ej. Peso del piloto, Estilo de manejo, Accesorios instalados).",
    devComboUniqueProductAddField: "Agregar Campo",
    devComboUniqueProductFieldName: "Nombre del Campo",
    devComboUniqueProductFieldType: "Tipo de Campo",
    devComboUniqueProductFieldTypeText: "Texto Libre",
    devComboUniqueProductFieldTypeNumber: "Número",
    devComboUniqueProductFieldTypeSelect: "Opciones (Menú Desplegable)",
    devComboUniqueProductFieldOptionsPrompt: "Opciones separadas por coma (ej: Dunas, Trail, Rocas)",
    devComboUniqueProductFieldRequired: "Obligatorio",
    devComboUniqueProductQuickCreateProduct: "Crear Producto Rápido en Catálogo",
    devComboUniqueProductQuickCreateModalTitle: "Crear y Vincular Nuevo Producto al Catálogo",
    devComboUniqueProductQuickCreateSuccess: "Producto creado exitosamente y vinculado al combo.",
    comboUniqueProductBadgeDefault: "PRODUCTO / SERVICIO EXCLUSIVO",
    comboUniqueProductCustomizationTitle: "Personalización Requerida para este Combo",
    comboUniqueProductCustomizationSubtitle: "Por favor especifica los siguientes detalles para que nuestros técnicos preparen y calibren el paquete exactamente para ti y tu vehículo.",
    comboUniqueProductRequiredMissing: "Por favor completa los siguientes campos de personalización del combo antes de continuar:",
    devComboAvailabilityCol: "Disponibilidad",
    devComboAvailabilityLiveTitle: "Disponibilidad Dinámica del Combo",
    devComboAvailabilityNotice: "La disponibilidad de este combo se calcula automáticamente en tiempo real según el stock de sus productos listados.",
    devComboStockInStock: "En Stock",
    devComboStockPreOrder: "Bajo Pre-Orden",
    devComboStockLowStock: "Stock Bajo",
    devComboStockOutOfStock: "Agotado en Proveedor",
    devComboStockUnavailable: "No Disponible",
    devComboMissingComponentsWarning: "Uno o más componentes listados están agotados o no disponibles.",
    devComboAllComponentsReady: "Todos los componentes listados están listos para despacho.",
    comboOutOfStockAlertTitle: "Combo Temporalmente No Disponible",
    comboOutOfStockAlertDesc: "Uno o más de los productos incluidos en este paquete están temporalmente fuera de stock en el fabricante. Puedes solicitar una cotización personalizada o consultar alternativas con nuestros asesores.",
    comboComponentInStock: "En stock",
    comboComponentPreOrder: "Pre-orden",
    comboComponentOutOfStock: "Agotado",
    comboComponentArchived: "Descatalogado",
    comboQuoteBecauseOutOfStock: "Consultar Piezas por WhatsApp",
    devItemsIncluded: "Artículos Incluidos en el Kit",
    devOriginalPrice: "Precio Regular / Original (₡)",
    devDiscountPercent: "Descuento (%)",
    devBadgeLabel: "Insignia / Badge",
    devCombosListTitle: "Combos y Kits de Accesorios",
    devProductsListTitle: "Productos del Catálogo",
    devStockStatus: "Estado de Stock",
    devBaseHardwarePrice: "Precio Base de Hardware (₡)",
    devLaborInstallCost: "Mano de Obra / Instalación (₡)",
    devInstallLabourCostLabel: "Costo de Mano de Obra de Instalación (₡)",
    devInstallExtraPartsLabel: "Repuestos y Materiales Extra de Instalación",
    devInstallExtraPartsAddBtn: "+ Agregar Repuesto / Material",
    devInstallExtraPartsNamePlaceholder: "Nombre del repuesto (ej: Relé 40A, Arnés, Base)",
    devInstallExtraPartsPricePlaceholder: "Precio (₡)",
    devInstallExtraPartsEmpty: "No hay repuestos o materiales extra registrados para esta instalación.",
    devInstallExtraPartsTotal: "Subtotal Repuestos Extra",
    devInstallProfitLabel: "Ganancia de Instalación (₡)",
    devInstallTotalCostLabel: "Costo Total de Instalación (I_price)",
    devInstallBreakdownHelp: "Suma la mano de obra, los repuestos/materiales extra y la ganancia para calcular el costo total de instalación y rastrear mejor los gastos.",
    devComboAddProductInstallCostsBtn: "Sumar costos de instalación de los productos incluidos",
    devComboProductsInstallSummary: "Suma de instalación de los productos seleccionados",
    devStaffInstallEditable: "Editable por personal técnico (Staff)",
    devMasterPriceOnly: "Solo perfil Master puede editar precio base",
    devFreeInstallationCheckbox: "Instalación Gratis (Incluida en el precio)",
    devFreeInstallationHelp: "Al activar esta opción, la tienda mostrará el distintivo de 'Instalación Gratis' y el costo de instalación se incluirá como ₡0 en la tienda.",
    devFreeInstallationBadge: "Instalación Incluida",
    devCompLabel: "Tags de Compatibilidad (comp)",
    devCategoryLabel: "Categorías (category)",
    devBrandLabel: "Marca (brand)",
    devAutoGenerateSkuBtn: "✨ Generar SKU Automático",
    devSkuPatternHelp: "Patrón: [Marca SKU] - [Vehículo(s) SKU] - [Secuencia Marca (ej: 04)]",
    devPriceBreakdownTitle: "Desglose Completo de Precios (price)",
    devPriceProcessingUSD: "P_price_D (Precio base en dólares - USD)",
    devPriceProcessingCRC: "P_price (Precio base en colones)",
    devPriceShippingCRC: "S_price (Flete e importación en colones)",
    devPriceLaborCRC: "I_price (Mano de obra / Instalación en colones)",
    devPriceProfitCRC: "profit (Margen de ganancia en colones)",
    devPriceTotalCRC: "T_price (Precio Total de venta en colones)",
    devPriceTotalUSD: "T_price_D (Referencia / Cálculo en dólares)",
    devPriceDollarNotice: "El precio en dólares del producto solo se mostrará en el checkout donde el cliente puede elegir en qué moneda pagar.",
    devAutoCalculatePrice: "Calcular Total Automático",
    devImagesListLabel: "Galería de Imágenes (imgs)",
    devVideosListLabel: "Muestras de Video (vids)",
    devAudiosListLabel: "Muestras de Audio HD (audios)",
    devProductTitleLabel: "Título del Producto (p_title)",
    devRequirementsLabel: "Requerimientos Técnicos (requirements)",
    devReviewsLabel: "Reseñas / Calificaciones (reviews)",
    devInHomeInstallLabel: "inHome_install (Instalación a Domicilio disponible)",
    devYearCompatLabel: "Compatibilidad por Años y Modelos (year_compatability)",
    devAudioPreview: "Muestra de Audio HD",
    devSpecsAndDesc: "Especificaciones y Descripción",
    devCompatibilityList: "Compatibilidad de Vehículos SXS & Años",
    devHomeInstallEligible: "Elegible para Instalación a Domicilio",
    devCompVehiclesLabel: "Vehículos Compatibles (comp)",
    devAddVehicleSelector: "Agregar Vehículo Compatible",
    devSelectVehiclePrompt: "-- Seleccionar Vehículo Registrado --",
    devRemoveVehicle: "Eliminar vehículo",
    devUniversalFitment: "Universal (Todos los modelos)",
    devCategorySelectorLabel: "Categoría de Producto",
    devSelectCategoryPrompt: "-- Seleccionar Categoría --",
    devAddCategoryBtn: "Agregar Categoría",
    devNewCategoryBtn: "+ Nueva Categoría",
    devComboCategoryLabel: "Categoría del Combo",
    devAddCategoryModalTitle: "Crear Nueva Categoría",
    devAddCategoryModalDesc: "Agrega una nueva categoría al catálogo. La primera letra siempre se mantendrá en mayúscula.",
    devCategoryNameEsLabel: "Nombre de la Categoría (Español)",
    devCategoryNameEnLabel: "Nombre de la Categoría (Inglés - Opcional)",
    devCategoryCreatedSuccess: "¡Categoría creada exitosamente!",
    devCategoryCreateError: "Error al crear la categoría",
    devCategoryCapsNotice: "La primera letra siempre debe ser mayúscula",

    // Pick-up, Delivery & Home Installation
    servicesTitle: "Servicios de Traslado e Instalación",
    servicesSubtitle: "Pick-up de vehículos, entregas a domicilio e instalación técnica en sitio desde nuestro taller en Pozos, Santa Ana.",
    serviceTabPickup: "Pick-up de Vehículo",
    serviceTabDelivery: "Entrega / Delivery",
    serviceTabInstallation: "Instalación a Domicilio",
    serviceTabShopInstallation: "Solo Instalación (En Taller)",
    servicePickupDesc: "Recolección y entrega de tu vehículo en plataforma. El precio cubre el retiro y la posterior entrega; no se cobrará transporte adicional al devolverlo.",
    servicePickupRoundTripNotice: "El precio cubre el retiro y la entrega posterior del vehículo. No se cobrará flete adicional en la entrega.",
    servicePickupRoundTripBadge: "Incluye Retiro y Entrega (Ida y Vuelta)",
    // Pick-up vehicle compatibility specifications (LE-01)
    pickupCompatTitle: "Especificaciones y Requisitos de Compatibilidad (Plataforma)",
    pickupCompatSubtitle: "Verifica que tu vehículo cumpla con las dimensiones y condiciones mecánicas para transporte seguro en plataforma ZxZ Mods.",
    pickupCompatCategory: "Tipos de Vehículo Compatibles",
    pickupCompatCategoryVal: "SxS, UTV y ATV (CFMOTO, Can-Am, Polaris, Yamaha, Honda, Segway y afines)",
    pickupCompatMaxWidth: "Ancho Máximo de Trocha",
    pickupCompatMaxWidthVal: "Hasta 74 pulgadas (1.88 m) de ancho exterior",
    pickupCompatMaxLength: "Largo Máximo de Chasis",
    pickupCompatMaxLengthVal: "Hasta 4.20 m (165\") de longitud total",
    pickupCompatMaxWeight: "Peso Máximo Soportado",
    pickupCompatMaxWeightVal: "Hasta 1,600 kg (3,520 lbs) de peso de unidad",
    pickupCompatMaxHeight: "Altura Máxima de Techo/Roll-Cage",
    pickupCompatMaxHeightVal: "Hasta 2.10 m (83\") de despeje de altura",
    pickupCompatCondition: "Condición Mecánica Requerida",
    pickupCompatConditionVal: "Ruedas y dirección operables, transmisión en neutro o wincheable (frenos libres para montado seguro)",
    pickupCompatNote: "Si tu máquina cuenta con modificaciones extremas (lift kit >6\", llantas >35\" o ancho ensanchado >74\"), por favor contáctanos previamente por WhatsApp para coordinar transporte especial.",

    // Delivery Window & Estimates (LE-02)
    deliveryWindowBanner: "Plazo de Entrega: Mínimo 7 a Máximo 21 Días Hábiles",
    deliveryWindowDisclaimer: "Los plazos de entrega indicados son estimaciones profesionales y NO constituyen una garantía de fecha fija debido a la logística aérea e inspecciones aduaneras.",

    // Suggested Combos & Products (LE-03)
    productSuggestedCombosTitle: "Combos Sugeridos con este Producto",
    productSuggestedCombosSubtitle: "Paquetes completos verificados que incluyen este artículo o repuestos afines con descuento especial.",
    productSuggestedProductsTitle: "Productos Recomendados y Relacionados",
    productSuggestedProductsSubtitle: "Accesorios, repuestos y componentes de la misma categoría o plataforma para tu vehículo.",
    productViewComboBtn: "Ver Combo Completo",
    productViewProductBtn: "Ver Producto",
    productSuggestedEmpty: "No se encontraron otros artículos relacionados por el momento.",

    // Products Analysis (FA-03)
    productsAnalysisTitle: "Análisis de Desempeño de Productos",
    productsAnalysisSubtitle: "Métricas consolidadas de ventas, marcas más comercializadas y productos con mayor rentabilidad para el equipo de staff.",
    productsAnalysisMostSoldBrand: "Marca Más Vendida",
    productsAnalysisMostSoldItem: "Producto Más Vendido",
    productsAnalysisMostSoldCombo: "Combo Más Vendido",
    productsAnalysisHighestMargin: "Mayor Margen de Ganancia",

    serviceDeliveryDesc: "Envío rápido y seguro de repuestos, accesorios y combos directo a tu puerta o taller.",
    serviceInstallationDesc: "Técnicos certificados con taller móvil equipados para instalar tus piezas directamente en tu cochera o finca.",
    serviceShopInstallationDesc: "Traes tu SxS directamente a nuestro taller. Sin costo de traslado. Agenda tu fecha y hora para que el equipo lo instale.",
    serviceShopInstallationBadge: "Sin Traslado (₡0)",
    serviceShopDirectNotice: "Llevarás tu vehículo a nuestro taller en Calle 34, Pozos de Santa Ana. No aplica costo de transporte.",
    serviceLocationPrecisionError: "Ingresa una ubicación más precisa (al menos 3 caracteres)",
    calendarTitle: "Calendario de Disponibilidad",
    calendarSelectDate: "Selecciona una fecha disponible",
    calendarSelectedDate: "Fecha seleccionada",
    calendarClosedSunday: "Domingos cerrado (Atención WhatsApp)",
    calendarPrevMonth: "Mes anterior",
    calendarNextMonth: "Mes siguiente",
    timeSlotMorning: "Mañana (8:00 AM - 12:00 PM)",
    timeSlotAfternoon: "Tarde (1:00 PM - 5:00 PM)",
    garageOriginLabel: "Taller ZxZ Mods (Origen)",
    garageOriginAddress: "Calle 34, Pozos, Santa Ana, Costa Rica",
    destinationInputLabel: "Dirección o Lugar de Destino",
    destinationInputPlaceholder: "Ingresa cantón, distrito o lugar (ej. Escazú, Lindora, Belén, Guácima...)",
    quickLocationsLabel: "Zonas frecuentes:",
    useCurrentLocationBtn: "Usar mi ubicación actual",
    calculatingRoute: "Calculando ruta y kilometraje...",
    distanceLabel: "Distancia estimada",
    timeLabel: "Tiempo aprox. de viaje",
    ratePerKmLabel: "Tarifa por km",
    baseRateLabel: "Tarifa base",
    totalCostLabel: "Costo Total Estimado",
    openGoogleMapsBtn: "Abrir en Google Maps",
    openWazeBtn: "Navegar con Waze",
    requestServiceWhatsAppBtn: "Solicitar Servicio por WhatsApp",
    backdoorLogisticsTab: "Tarifas por Km",
    backdoorLogisticsTitle: "Configuración de Tarifas por Kilómetro",
    backdoorLogisticsSubtitle: "Variables de cobro por km para Pick-up, Delivery e Instalación a Domicilio desde Calle 34, Pozos, Santa Ana.",
    backdoorPickupRate: "Tarifa Pick-up por Km (₡)",
    backdoorDeliveryRate: "Tarifa Delivery por Km (₡)",
    backdoorInstallationRate: "Tarifa Instalación a Domicilio por Km (₡)",
    backdoorPickupBase: "Tarifa Base Pick-up (₡)",
    backdoorDeliveryBase: "Tarifa Base Delivery (₡)",
    backdoorInstallationBase: "Tarifa Base Instalación (₡)",
    backdoorGarageAddress: "Dirección del Garaje / Taller",
    backdoorRatesSavedSuccess: "Tarifas actualizadas correctamente en la base de datos",
    backdoorTestCalculatorTitle: "Simulador de Tarifas en Tiempo Real",
    serviceOrdersTitle: "Órdenes listas para programar",
    serviceOrdersSubtitle: "Selecciona una orden activa para agendar el servicio. Puedes calcular precios y distancias libremente.",
    serviceOrdersNoneFound: "No tienes órdenes listas en tu cuenta. Puedes calcular precios libremente a continuación.",
    serviceOrdersLoginPrompt: "Inicia sesión o ingresa tu # de orden para agendar:",
    serviceOrdersSearchPlaceholder: "Ej. ZXZ-123456",
    serviceOrdersSearchBtn: "Buscar",
    serviceOrdersSelectedOrder: "Orden seleccionada",
    serviceOrdersRequiredNotice: "Se requiere una orden para programar el servicio. Puedes consultar precios y distancias libremente.",
    serviceDateTitle: "Fecha y Horario del Servicio",
    serviceDateLabel: "Fecha de ejecución",
    serviceTimeLabel: "Franja horaria",
    servicePresenceNotice: "Una persona debe estar presente para la recepción y entrega final del servicio.",
    serviceScheduleBtn: "Programar Servicio",
    serviceScheduleRequiresOrder: "Selecciona una orden arriba para agendar el servicio",
    serviceScheduleRequiresLocation: "Fija tu ubicación en el mapa",
    serviceScheduleRequiresDate: "Selecciona una fecha de ejecución",
    serviceScheduleSuccess: "¡Servicio programado exitosamente!",
    clickMapToSetLocation: "Haz clic en el mapa para fijar tu ubicación",
    serviceAvailabilityTitle: "Disponibilidad de Horarios",
    serviceOperatingHours: "Horario de despacho: 8:00 AM a 8:00 PM",
    serviceSlotBlocked: "Bloqueado por traslado / despacho",
    serviceSlotAvailable: "Disponible",
    serviceSelectedTime: "Hora de llegada al cliente",
    serviceTravelBufferExplanation: "El sistema bloquea automáticamente el tiempo de viaje de ida y vuelta más 30 minutos de preparación y entrega para evitar retrasos.",
    serviceHomeInstallFullDayNote: "La instalación a domicilio reserva la jornada completa (8:00 AM - 8:00 PM) para el equipo técnico.",
    serviceCostResumeTitle: "Resumen de Costos y Logística",
    serviceTripSummaryHeading: "Desglose de Traslado y Tiempos",
    serviceRoundTripTravel: "Viaje de ida y vuelta",
    serviceBufferPrep: "Preparación de paquete y entrega",
    servicePayAndReserveBtn: "Pagar y Reservar Servicio",
    serviceConfirmAndReserveFreeBtn: "Confirmar y Reservar en Taller (₡0)",
    serviceTransferAmount: "Monto a Transferir por el Servicio",
    serviceFreeTransportNotice: "Servicio en taller sin costo de transporte adicional (₡0)",
    serviceUploadingReceipt: "Subiendo comprobante de pago...",
    serviceRegisteringReservation: "Registrando y reservando servicio...",
    servicePaymentReceiptRequired: "Debes adjuntar el comprobante de transferencia bancaria",
    servicePhoneRequired: "Por favor ingresa un número de teléfono de contacto",
    serviceTermsRequired: "Debes aceptar los Acuerdos y Condiciones de Pago",
    servicePaymentAccountsHeading: "Cuentas Bancarias para el Pago del Servicio",
    servicePaymentAccountsSubtitle: "Realiza tu transferencia bancaria y adjunta el comprobante abajo",
    servicePaymentProofSuccess: "¡Servicio programado y comprobante de pago registrado exitosamente!",
    servicePhoneInputLabel: "Teléfono o Celular de Contacto (Obligatorio)",
    servicePhoneInputHelp: "Para coordinar con el chofer y equipo técnico al llegar a tu ubicación o taller.",
    servicePaymentAgreementNotice: "ZxZ Mods no se hace responsable por transferencias realizadas a cuentas erróneas o montos incorrectos. La reserva del servicio quedará confirmada al validar los fondos en cuentas oficiales.",
    servicePaymentAgreementCheckbox: "He leído, entiendo y acepto los Acuerdos y Condiciones de Pago",
    serviceProceedToPaymentBtn: "Proceder al Pago del Servicio",
    serviceProceedToConfirmFreeBtn: "Confirmar Reserva en Taller (₡0)",
    serviceOrdersDeselect: "Deseleccionar",
    serviceOrdersDeselectAll: "Quitar todas",
    serviceOrdersMultiAllowed: "Puedes seleccionar 2 o más órdenes para entrega o instalación en taller",
    serviceOrdersSingleOnly: "Atención individual: 1 orden por servicio",
    serviceBackToServices: "Volver a Configuración de Servicio",
    servicePaymentStepTitle: "Pago y Confirmación de Servicio",
    servicePaymentStepSubtitle: "Transfiere el monto correspondiente y adjunta tu comprobante para asegurar tu fecha y hora",
    serviceSummaryTitle: "Detalles del Servicio Programado",
    serviceMultipleOrdersCount: "órdenes seleccionadas",
    serviceSelectedOrdersLabel: "Órdenes a Atender en este Servicio",
    serviceHomeInstallIneligibleBadge: "No califica para domicilio",
    serviceHomeInstallIneligibleReason: "Tu orden incluye piezas o componentes que requieren herramientas de taller y no califican para instalación a domicilio.",
    serviceHomeInstallIneligibleOrderAlert: "Esta orden contiene productos que no califican para instalación a domicilio. Se ha bloqueado esta opción.",
    serviceHomeInstallAutoSwitchedNotice: "Se seleccionó 'Solo Instalación en Taller' automáticamente porque la orden contiene productos no aptos a domicilio.",
    serviceHomeInstallBackendDisqualified: "La orden contiene productos que no califican para instalación a domicilio. Por favor selecciona instalación en taller o entrega.",
    serviceHomeInstallOrderTag: "Solo Taller / Entrega",
    serviceOrdersInstallFeeLabel: "Instalación de repuestos en orden",
    serviceTransportFeeLabel: "Traslado / Transporte técnico",
    serviceTotalWithInstallLabel: "Total del Servicio e Instalación",
    servicePickupInstallHeading: "Instalación pendiente",
    servicePickupInstallPaidOnRetrievalNotice: "El costo de instalación de los repuestos se cancelará al retirar o entregar tu vehículo (no se incluye en este pago).",
    serviceShopInstallReserveBtn: "Reservar Cita en Taller (₡0)",
    serviceShopInstallNotice: "Reserva de fecha sin costo inicial. La mano de obra se cancelará durante la etapa de 'Pago de Instalación'.",
    serviceShopInstallOverlayTitle: "¡Cita de Instalación Reservada!",
    serviceShopInstallOverlaySub: "Tu cita en taller ZxZ ha sido confirmada sin costo inicial. La mano de obra se cancelará durante la etapa de Pago de Instalación.",
    serviceSubtotalNetLabel: "Subtotal Neto",
    serviceIvaTaxLabel: "IVA (13%)",
    serviceOrderAlreadyInConfirmation: "Esta orden ya se encuentra en confirmación de pago de servicio. No se puede seleccionar para otro servicio.",
    serviceOrderAlreadyProgrammed: "Esta orden ya tiene un servicio programado y no puede ser seleccionada nuevamente.",
    serviceOrderAlreadyProgrammedBadge: "Servicio Ya Programado",
    serviceSlotCollisionAlert: "El horario seleccionado acaba de ser reservado por otro cliente. Por favor selecciona otra fecha u horario disponible.",
    servicePayWithCardBac: "Pagar con Tarjeta (BAC Compra Click)",
    servicePayWithCardBacDesc: "Solicita un enlace seguro BAC Compra Click por WhatsApp para pagar tu servicio con tarjeta de crédito o débito.",
    servicePayWithCardGenerating: "Generando solicitud BAC Compra Click y abriendo WhatsApp...",
    installationPayWithCardBac: "Pagar con Tarjeta (BAC Compra Click)",
    installationPayWithCardBacDesc: "Solicita un enlace seguro BAC Compra Click por WhatsApp para pagar la mano de obra de instalación con tarjeta.",
    installationPayWithCardGenerating: "Generando solicitud BAC Compra Click y abriendo WhatsApp...",
    serviceTotalWithIvaLabel: "Total con IVA (13%)",
    servicePricesIncludeIvaBadge: "IVA 13% Incluido",
    installationLaborSubtotalLabel: "Subtotal Mano de Obra",
    installationIvaTaxLabel: "IVA Mano de Obra (13%)",
    installationTotalWithIvaLabel: "Total a Transferir (IVA 13% inc.)",
    backdoorBlockHoursModalTitle: "Bloquear Horario o Día en Agenda",
    backdoorBlockModeLabel: "Tipo de Bloqueo",
    backdoorBlockModeHours: "Horas Específicas del Día",
    backdoorBlockModeDay: "Día Completo",
    backdoorBlockModeRuta: "Ruta BarrialCR (Rides)",
    backdoorBlockStartHour: "Hora de Inicio (24h)",
    backdoorBlockEndHour: "Hora de Fin (24h)",
    backdoorBlockReasonLabel: "Motivo / Tarea (Ej. Instalación Técnica en Taller)",
    backdoorBlockSaveBtn: "Aplicar Bloqueo",
    backdoorBlockedHoursBadge: "Horas Bloqueadas (Taller)",
    serviceBlockedHoursNotice: "Horario reservado por el taller para instalaciones internas",
    serviceInTransitNotice: "Horario no disponible: el personal técnico se encuentra en ruta/despacho externo",
    backdoorVehiclesTab: "Vehículos Garaje",
    backdoorVehiclesTitle: "Catálogo de Vehículos para Mi Garaje",
    backdoorVehiclesSubtitle: "Agrega, edita y organiza los vehículos, marcas y modelos que los clientes pueden seleccionar y registrar en su Garaje.",
    backdoorVehiclesAddBtn: "+ Agregar Vehículo",
    backdoorVehiclesTotalBrands: "Marcas Registradas",
    backdoorVehiclesTotalModels: "Modelos Disponibles",
    backdoorVehiclesSearchPlaceholder: "Buscar por modelo o marca...",
    backdoorVehiclesFilterAllBrands: "Todas las Marcas",
    backdoorVehiclesFilterAllCategories: "Todas las Categorías",
    backdoorVehiclesModalCreateTitle: "Agregar Nuevo Modelo de Vehículo",
    backdoorVehiclesModalEditTitle: "Editar Modelo de Vehículo",
    backdoorVehiclesBrandLabel: "Marca del Vehículo",
    backdoorVehiclesSelectBrandPrompt: "-- Selecciona una Marca --",
    backdoorVehiclesCreateNewBrandToggle: "+ Crear Nueva Marca",
    backdoorVehiclesNewBrandName: "Nombre de la Nueva Marca",
    backdoorVehiclesNewBrandSlug: "Slug de la Marca (ej: can-am, polaris)",
    backdoorVehiclesModelNameLabel: "Nombre del Modelo (ej: ZForce Z10)",
    backdoorVehiclesModelSlugLabel: "Slug del Modelo (ej: zforce-z10)",
    backdoorVehiclesModelCodeLabel: "Código SKU del Modelo / Vehículo",
    backdoorVehiclesModelCodePlaceholder: "ej. Z10, X3, PROR, TALON",
    backdoorVehiclesModelCodeHelp: "Prefijo de SKU utilizado al generar productos compatibles con este vehículo",
    backdoorVehiclesCategoryLabel: "Categoría de Vehículo",
    backdoorVehiclesYearsLabel: "Años Compatibles",
    backdoorVehiclesYearFromLabel: "Desde Año",
    backdoorVehiclesYearToLabel: "Hasta Año",
    backdoorVehiclesImageUrlLabel: "URL de Imagen del Vehículo (Opcional)",
    backdoorVehiclesUploadImageBtn: "Subir Imagen del Vehículo",
    backdoorVehiclesUploadingImage: "Subiendo imagen...",
    backdoorVehiclesRemoveImageBtn: "Quitar imagen",
    backdoorVehiclesChangeImageBtn: "Cambiar imagen",
    backdoorVehiclesSaveSuccess: "¡Vehículo agregado exitosamente al catálogo del Garaje!",
    backdoorVehiclesUpdateSuccess: "¡Vehículo actualizado correctamente!",
    backdoorVehiclesDeleteConfirm: "¿Estás seguro de eliminar este modelo de vehículo del Garaje?",
    backdoorVehiclesDeleteSuccess: "Modelo de vehículo eliminado.",
    backdoorVehiclesEmptyState: "No se encontraron modelos de vehículos registrados con este filtro.",
    backdoorVehiclesPickupEligibleLabel: "Compatible con Pick-up (Remolque)",
    backdoorVehiclesPickupEligibleHelp: "Indica si este modelo de vehículo califica para ser transportado en plataforma o remolque.",

    // Garage Brands Management Keys
    backdoorVehiclesSubtabModels: "Modelos de Vehículo",
    backdoorVehiclesSubtabBrands: "Marcas de Vehículos",
    backdoorVehiclesBrandsTitle: "Gestor de Marcas de Vehículos para Garaje",
    backdoorVehiclesBrandsSubtitle: "Agrega, edita y organiza las marcas de vehículos, sus logos oficiales e imágenes de vehículo por defecto que se muestran en el Garaje.",
    backdoorVehiclesAddBrandBtn: "+ Agregar Marca",
    backdoorVehiclesEditBrandBtn: "Editar Marca",
    backdoorVehiclesBrandModalCreateTitle: "Agregar Nueva Marca de Vehículo",
    backdoorVehiclesBrandModalEditTitle: "Editar Marca de Vehículo",
    backdoorVehiclesBrandNameLabel: "Nombre de la Marca (ej: CAN-AM, CFMOTO)",
    backdoorVehiclesBrandSlugLabel: "Slug / Identificador (ej: can-am, cfmoto)",
    backdoorVehiclesBrandLogoLabel: "Logo Oficial de la Marca",
    backdoorVehiclesBrandUploadLogoBtn: "Subir Logo",
    backdoorVehiclesBrandUploadingLogo: "Subiendo logo...",
    backdoorVehiclesBrandDefaultVehicleImgLabel: "Imagen de Vehículo por Defecto",
    backdoorVehiclesBrandDefaultVehicleImgHelp: "Esta imagen se mostrará automáticamente en el garaje para cualquier vehículo registrado de esta marca que no tenga una imagen específica configurada.",
    backdoorVehiclesBrandUploadVehicleImgBtn: "Subir Imagen de Vehículo",
    backdoorVehiclesBrandUploadingVehicleImg: "Subiendo imagen...",
    backdoorVehiclesBrandDescEsLabel: "Descripción en Español",
    backdoorVehiclesBrandDescEnLabel: "Descripción en Inglés",
    backdoorVehiclesBrandFeaturedLabel: "Marca Destacada",
    backdoorVehiclesBrandFeaturedHelp: "Muestra esta marca con prioridad visual en los filtros y catálogos.",
    backdoorVehiclesBrandSaveSuccess: "¡Marca creada exitosamente!",
    backdoorVehiclesBrandUpdateSuccess: "¡Marca actualizada exitosamente!",
    backdoorVehiclesBrandDeleteConfirm: "¿Estás seguro de eliminar esta marca de vehículo? Los modelos asociados a esta marca también serán eliminados.",
    backdoorVehiclesBrandDeleteSuccess: "Marca de vehículo eliminada exitosamente.",
    backdoorVehiclesBrandEmptyState: "No se encontraron marcas de vehículos con este filtro.",
    backdoorVehiclesBrandSearchPlaceholder: "Buscar por nombre, slug o descripción de marca...",
    backdoorVehiclesBrandFilterAll: "Todas las Marcas",
    backdoorVehiclesBrandFilterFeatured: "Solo Destacadas",
    backdoorVehiclesBrandFilterStandard: "Estándar",
    backdoorVehiclesBrandModelsCount: "modelos registrados",

    // Pick-Up Service Garage Vehicle Compatibility Keys
    servicePickupVehicleIncompatibleBadge: "Vehículo Incompatible con Pick-up",
    servicePickupVehicleIncompatibleAlert: "El vehículo en tu garaje no es compatible con el servicio de traslado en remolque.",
    servicePickupVehicleIncompatibleDesc: "Tu vehículo registrado no califica para el servicio de grúa/remolque según nuestro catálogo técnico.",
    servicePickupVehicleCompatibleBadge: "Vehículo Compatible con Pick-up",
    servicePickupNoGarageVehicleNotice: "Selecciona o registra un vehículo en Mi Garaje para verificar la compatibilidad con el servicio de Pick-up.",
    servicePickupGarageVehicleLabel: "Vehículo en Garaje:",
    servicePickupOpenGarageBtn: "Abrir Mi Garaje",
    servicePickupCompatVerifiedNotice: "Compatibilidad confirmada para transporte en plataforma con tu vehículo.",
    servicePickupGarageCompatTitle: "Compatibilidad con Mi Garaje",
    servicePickupGarageCompatSubtitle: "Verificación del vehículo registrado para traslado en remolque / plataforma.",
    servicePickupGarageCompatSuccess: "Tu vehículo en el garaje califica para ser trasladado en plataforma de remolque.",
    servicePickupGarageCompatFail: "Este modelo de vehículo no califica para transporte en remolque según el catálogo técnico.",

    // Nuevas traducciones para Agenda, Cuentas Bancarias, Cambios sin guardar y Estado de pedido
    orderStatusPreparingOrder: "Pago confirmado, preparando pedido",
    orderStatusPreparingOrderDesc: "Pago recibido y verificado correctamente. Preparando adquisición de piezas.",
    orderTransportOnlyAfterPaymentNotice: "El servicio de transporte solo puede agendarse una vez confirmado el pago del pedido.",
    devUnsavedChangesTitle: "¿Descartar cambios no guardados?",
    devUnsavedChangesPrompt: "Tienes modificaciones sin guardar en este producto. Si sales ahora, todos los cambios se perderán.",
    devUnsavedChangesStay: "Continuar editando",
    devUnsavedChangesDiscard: "Descartar y salir",
    backdoorAgendaTab: "Agenda & Calendario",
    backdoorBankAccountsTab: "Cuentas Bancarias",
    backdoorBankAccountsTitle: "Cuentas Bancarias Oficiales (Solo Master)",
    backdoorBankAccountsSubtitle: "Administra las cuentas bancarias oficiales (IBAN) donde los clientes realizan las transferencias de pago.",
    backdoorBankAccountsAddBtn: "+ Agregar Cuenta Bancaria",
    backdoorBankAccountsEditTitle: "Editar Cuenta Bancaria",
    backdoorBankAccountsCreateTitle: "Nueva Cuenta Bancaria",
    backdoorBankAccountsDeleteConfirm: "¿Confirmas la eliminación de esta cuenta bancaria?",
    backdoorBankAccountsDeleteSuccess: "Cuenta bancaria eliminada exitosamente.",
    backdoorBankAccountsSaveSuccess: "Cuenta bancaria guardada exitosamente.",
    backdoorBankAccountsSubTabAccounts: "Cuentas Bancarias",
    backdoorBankAccountsSubTabDiscounts: "Códigos de Descuento (Master)",
    backdoorExchangeRateTab: "Tipo de Cambio (Dólar)",
    backdoorExchangeRateTitle: "Tipo de Cambio y Valor de Venta del Dólar (BCCR)",
    backdoorExchangeRateSubtitle: "Gestiona el valor del dólar utilizado para cotizaciones, carrito de compra y checkout. Sincroniza en tiempo real con el BCCR o establece un valor manual personalizado.",
    backdoorExchangeRateLiveLabel: "Valor de Venta Oficial / Activo (USD)",
    backdoorExchangeRateBuyLabel: "Valor de Compra (USD)",
    backdoorExchangeRateAutoMode: "Sincronización Automática con BCCR",
    backdoorExchangeRateManualMode: "Modo Manual (Modificar / Fijar Valor)",
    backdoorExchangeRateAutoDesc: "El sistema consulta diariamente los servidores del Banco Central de Costa Rica (BCCR) y actualiza el tipo de cambio automáticamente.",
    backdoorExchangeRateManualDesc: "Fija manualmente un tipo de cambio específico. El valor manual prevalecerá en todas las cotizaciones hasta que decidas cambiarlo o volver a automático.",
    backdoorExchangeRateInputLabel: "Valor de Venta del Dólar (₡ por $1 USD)",
    backdoorExchangeRateBuyInputLabel: "Valor de Compra del Dólar (₡ por $1 USD)",
    backdoorExchangeRateNotesLabel: "Motivo / Nota del Ajuste Manual",
    backdoorExchangeRateNotesPlaceholder: "Ej: Tasa comercial BAC San José / Ajuste por volatilidad cambiaria",
    backdoorExchangeRateSaveManualBtn: "Guardar Valor Manual",
    backdoorExchangeRateRestoreAutoBtn: "Volver a Sincronización Automática BCCR",
    backdoorExchangeRateSyncNowBtn: "Probar y Sincronizar BCCR en Vivo",
    backdoorExchangeRateDiagnosticsTitle: "Diagnóstico de Proveedores y APIs del BCCR",
    backdoorExchangeRateProviderStatus: "Estado",
    backdoorExchangeRateLatency: "Latencia",
    backdoorExchangeRateStatusActive: "Sincronizado BCCR",
    backdoorExchangeRateStatusOverride: "Modo Manual Activo",
    backdoorExchangeRateLastSync: "Última sincronización",
    backdoorBankAccountsSubTabExchangeRate: "Tipo de Cambio / Dólar (BCCR)",
    backdoorBankAccountsExchangeSectionTitle: "Tipo de Cambio Oficial del Dólar (Venta / Compra)",
    backdoorBankAccountsExchangeSectionDesc: "El valor del dólar es requerido para convertir productos cotizados y calcular el monto exacto en pagos en dólares.",
    backdoorBankAccountsManageExchangeBtn: "Configurar / Modificar Tipo de Cambio",
    backdoorDiscountsTitle: "Códigos de Descuento Oficiales (Solo Master)",
    backdoorDiscountsSubtitle: "Crea, activa y gestiona cupones de descuento aplicables automáticamente en la pantalla de checkout.",
    backdoorDiscountsAddBtn: "+ Crear Código de Descuento",
    backdoorDiscountsEditTitle: "Editar Código de Descuento",
    backdoorDiscountsCreateTitle: "Nuevo Código de Descuento",
    backdoorDiscountsDeleteConfirm: "¿Confirmas la eliminación permanente de este código de descuento?",
    backdoorDiscountsSaveSuccess: "Código de descuento guardado exitosamente.",
    backdoorDiscountsDeleteSuccess: "Código de descuento eliminado correctamente.",
    backdoorDiscountsCode: "Código de Descuento",
    backdoorDiscountsCodePlaceholder: "Ej: ZXZ10, PROMO5000, VIPRIDER",
    backdoorDiscountsDescription: "Descripción / Nota Interna",
    backdoorDiscountsDescriptionPlaceholder: "Ej: Descuento de temporada 10% en piezas",
    backdoorDiscountsType: "Tipo de Descuento",
    backdoorDiscountsTypePercentage: "Porcentaje (%)",
    backdoorDiscountsTypeFixed: "Monto Fijo (₡ CRC)",
    backdoorDiscountsValue: "Valor del Descuento",
    backdoorDiscountsMinOrder: "Subtotal Mínimo de Piezas (₡)",
    backdoorDiscountsMaxDiscount: "Monto Máximo de Descuento (₡, opcional para %)",
    backdoorDiscountsMaxUses: "Límite Máximo de Usos (dejar vacío para ilimitado)",
    backdoorDiscountsUsesCount: "Usos Registrados",
    backdoorDiscountsExpiresAt: "Fecha de Expiración (opcional)",
    backdoorDiscountsStatusActive: "Activo (Disponible)",
    backdoorDiscountsStatusInactive: "Inactivo (Desactivado)",
    backdoorDiscountsEmpty: "No hay códigos de descuento registrados aún. Haz clic en '+ Crear Código de Descuento' para generar el primero.",
    checkoutDiscountTitle: "¿Tienes un Código de Descuento?",
    checkoutDiscountPlaceholder: "Ingresa tu código (ej: ZXZ10)",
    checkoutDiscountApplyBtn: "Aplicar Cupón",
    checkoutDiscountApplying: "Validando...",
    checkoutDiscountRemoveBtn: "Quitar",
    checkoutDiscountAppliedSuccess: "¡Cupón de descuento aplicado exitosamente!",
    checkoutDiscountRowLabel: "Descuento Aplicado",
    backdoorAgendaTitle: "Agenda de Servicios & Transportes",
    backdoorAgendaSubtitle: "Visualiza y gestiona todos los servicios de instalación y transporte programados en calendario estilo Google y lista cronológica.",
    backdoorAgendaCalendarView: "Vista Calendario (Google Calendar)",
    backdoorAgendaWeekView: "Semana (Google Calendar)",
    backdoorAgendaMonthView: "Mes",
    backdoorAgendaWarrantyTab: "Protección Garantía (GAR)",
    backdoorAgendaWeekInstallsOnly: "Solo Instalaciones",
    backdoorAgendaWeekAllServices: "Todos los Servicios (General)",
    backdoorAgendaWeekCurrentTime: "Hora actual",
    backdoorAgendaWarrantyCount: "Órdenes de Garantía",
    backdoorAgendaWarrantyDesc: "Desmontaje previo y reinstalación de piezas ZxZ para inspecciones de agencia",
    backdoorAgendaChronologicalView: "Lista Cronológica (Próximos Servicios)",
    backdoorAgendaScheduleServiceBtn: "Programar Servicio (/servicios)",
    backdoorAgendaServiceDetails: "Detalles del Servicio",
    backdoorAgendaTransportPaymentConfirmed: "Pago de Transporte Confirmado",
    backdoorAgendaTransportPaymentPending: "Pago de Transporte Pendiente",
    backdoorAgendaConfirmTransportPaymentBtn: "Confirmar Pago de Transporte",
    backdoorAgendaTransportPaymentSuccess: "Pago de transporte confirmado exitosamente.",
    backdoorBlockDaysBtn: "Bloquear Días",
    backdoorBlockDaysTitle: "Gestión de Días Bloqueados",
    backdoorBlockDaysSubtitle: "Bloquea días completos para servicios o asigna eventos como Ruta BarrialCR.",
    backdoorBlockDayToggle: "Bloquear este día",
    backdoorRutaBarrialToggle: "Bloqueo por Ruta BarrialCR (Organización de Rides)",
    backdoorSaveBlockBtn: "Guardar Bloqueo de Fecha",
    backdoorUnblockBtn: "Desbloquear Fecha",
    backdoorAppointmentCodeLabel: "Código de Cita",
    backdoorSearchByCodeOrOrder: "Buscar por código (#SRV-... / #BLK-...), orden o cliente...",
    backdoorEditAppointmentTitle: "Editar Cita de Servicio",
    backdoorEliminateAppointmentBtn: "Eliminar Cita",
    backdoorEliminateAppointmentConfirm: "¿Estás seguro de que deseas eliminar permanentemente esta cita de servicio? Esta acción no se puede deshacer.",
    backdoorEliminateAppointmentSuccess: "Cita eliminada exitosamente.",
    backdoorSaveAppointmentBtn: "Guardar Cambios de la Cita",
    backdoorTimeOverrideNote: "Horario de taller habilitado de 8:00 AM a 8:00 PM (08:00 - 20:00)",
    backdoorSearchOrderPlaceholder: "Buscar por número de orden (#COT-... o #ZXZ-...) o cliente...",
    backdoorSelectedOrderLabel: "Orden Seleccionada",
    backdoorChangeOrderBtn: "Cambiar Orden",
    calendarRutaBarrialBadge: "Ruta BarrialCR",
    calendarDayBlockedBadge: "Día Bloqueado",

    // Backdoor Home Page Content Manager
    backdoorHomePageTab: "Contenido de Inicio",
    backdoorHomePageTitle: "Administrador de Videos y Productos de Inicio",
    backdoorHomePageSubtitle: "Agrega o modifica los videos y productos destacados que se muestran en la página principal, incluyendo su redirección, categoría, descripción corta y título.",
    backdoorHomeAllItems: "Todos los Elementos",
    backdoorHomeVideos: "Videos Destacados",
    backdoorHomeProducts: "Productos Destacados",
    backdoorHomeAddItem: "Agregar Elemento",
    backdoorHomeEditItem: "Editar Elemento",
    backdoorHomeDeleteItem: "Eliminar",
    backdoorHomeItemType: "Tipo de Elemento",
    backdoorHomeTypeVideo: "Video de Inicio",
    backdoorHomeTypeProduct: "Producto de Inicio",
    backdoorHomeTitleEs: "Título (Español)",
    backdoorHomeTitleEn: "Título (Inglés)",
    backdoorHomeCategory: "Categoría",
    backdoorHomeCategoryPlaceholder: "Ej: Software & Potencia, CFMOTO Specialty, Escapes...",
    backdoorHomeDescEs: "Descripción Corta (Español)",
    backdoorHomeDescEn: "Descripción Corta (Inglés)",
    backdoorHomeRedirectUrl: "URL o Ruta de Redirección",
    backdoorHomeRedirectPlaceholder: "Ej: /performance, /marcas, /cotizar, /combos...",
    backdoorHomeMediaUrl: "URL de Imagen / Poster",
    backdoorHomeMediaPlaceholder: "https://... o ruta de imagen",
    backdoorHomeVideoUrl: "URL de Video MP4 (Opcional)",
    backdoorHomeVideoPlaceholder: "https://... o ruta de video .mp4",
    backdoorHomeOrder: "Orden de Visualización",
    backdoorHomeIsActive: "Visible en Página Principal",
    backdoorHomeStatusActive: "Activo",
    backdoorHomeStatusInactive: "Inactivo",
    backdoorHomeSaveBtn: "Guardar Elemento",
    backdoorHomeSaving: "Guardando...",
    backdoorHomeCancelBtn: "Cancelar",
    backdoorHomeDeleteConfirm: "¿Estás seguro de que deseas eliminar permanentemente este elemento de la página de inicio?",
    backdoorHomeEmptyState: "No se encontraron elementos para la página de inicio. Agrega el primero usando el botón superior.",
    backdoorHomeSuccessCreated: "Elemento agregado exitosamente a la página de inicio.",
    backdoorHomeSuccessUpdated: "Elemento actualizado correctamente.",
    backdoorHomeSuccessDeleted: "Elemento eliminado de la página de inicio.",
    backdoorHomeActions: "Acciones",
    backdoorHomeSearchPlaceholder: "Buscar por título o categoría...",
    backdoorHomeUploadImageBtn: "Subir Imagen",
    backdoorHomeUploadVideoBtn: "Subir Video (MP4 / WebM / MOV)",
    backdoorHomeUploadingImage: "Subiendo imagen...",
    backdoorHomeUploadingVideo: "Subiendo video...",
    backdoorHomeChangeImage: "Cambiar Imagen",
    backdoorHomeChangeVideo: "Cambiar Video",
    backdoorHomeRemoveImage: "Quitar Imagen",
    backdoorHomeRemoveVideo: "Quitar Video",
    backdoorHomeManualUrlToggle: "O ingresar URL manual",
    heroRelatedModalTitle: "Equipamiento Destacado",
    heroRelatedModalSubtitle: "Productos y combos relacionados a este video. Selecciona uno para ver detalles:",
    heroRelatedProductBadge: "Producto",
    heroRelatedComboBadge: "Combo",
    heroRelatedViewProduct: "Ver Producto",
    heroRelatedViewCombo: "Ver Combo",
    heroRelatedCloseModal: "Cerrar",
    backdoorHomeRelatedItemsSectionTitle: "Productos / Combos Relacionados al Video",
    backdoorHomeRelatedItemsSectionDesc: "Si agregas 2 o más productos/combos, el botón 'Conocer Más' abrirá un pop-up interactivo para que el cliente elija cuál explorar. Si agregas 0 o 1, mantendrá la redirección directa.",
    backdoorHomeRelatedAddBtn: "Agregar Producto o Combo",
    backdoorHomeRelatedSearchPlaceholder: "Buscar por nombre, SKU o categoría...",
    backdoorHomeRelatedEmpty: "No hay productos ni combos vinculados a este video aún.",
    backdoorHomeRelatedReplaceBtn: "Reemplazar",
    backdoorHomeRelatedRemoveBtn: "Quitar",
    backdoorHomeRelatedReplacingMode: "Haz clic en un producto o combo de la lista para reemplazarlo:",
    backdoorHomeRelatedCancelReplace: "Cancelar reemplazo",
    backdoorHomeRelatedFilterAll: "Todos",
    backdoorHomeRelatedFilterProducts: "Productos",
    backdoorHomeRelatedFilterCombos: "Combos",
    backdoorHomeSubTabMedia: "Videos y Productos",
    backdoorHomeSubTabDealerBrands: "Marcas Distribuidoras",
    backdoorDealerBrandsTitle: "Marcas Distribuidoras (Rueda de Inicio)",
    backdoorDealerBrandsSubtitle: "Administra las marcas y logos de distribuidores que rotan en la rueda continua de la página principal, junto con su redirección de búsqueda al hacer clic.",
    backdoorDealerBrandsAllCount: "Marcas Registradas",
    backdoorDealerBrandsAddBtn: "Agregar Marca Distribuidora",
    backdoorDealerBrandsEditBtn: "Editar Marca Distribuidora",
    backdoorDealerBrandsName: "Nombre de la Marca",
    backdoorDealerBrandsNamePlaceholder: "Ej: Bikeman Performance, SuperATV, Dynojet...",
    backdoorDealerBrandsCode: "Código SKU de la Marca Distribuidora",
    backdoorDealerBrandsCodePlaceholder: "ej. BMP, EVP, RPM, DRT",
    backdoorDealerBrandsCodeHelp: "Código base para generar automáticamente el SKU de productos de esta marca",
    backdoorDealerBrandsLogo: "Logo / Imagen de la Marca",
    backdoorDealerBrandsUploadLogo: "Subir Logo (PNG, SVG, JPG)",
    backdoorDealerBrandsUploadingLogo: "Subiendo logo...",
    backdoorDealerBrandsChangeLogo: "Cambiar Logo",
    backdoorDealerBrandsRemoveLogo: "Quitar Logo",
    backdoorDealerBrandsRedirectUrl: "Redirección de Búsqueda al Hacer Clic",
    backdoorDealerBrandsRedirectPlaceholder: "Ej: /productos?brand=Bikeman o /productos?q=Bikeman",
    backdoorDealerBrandsAutoRedirectHint: "Generar búsqueda automática",
    backdoorDealerBrandsOrder: "Orden de Rotación en la Rueda",
    backdoorDealerBrandsIsActive: "Visible en la Rueda de Inicio",
    backdoorDealerBrandsDeleteConfirm: "¿Estás seguro de que deseas eliminar permanentemente esta marca distribuidora de la rueda de inicio?",
    backdoorDealerBrandsEmpty: "No hay marcas distribuidoras registradas aún. Agrega la primera para que aparezca en la rueda de la página de inicio.",
    backdoorDealerBrandsSuccessCreated: "Marca distribuidora agregada exitosamente a la rueda.",
    backdoorDealerBrandsSuccessUpdated: "Marca distribuidora actualizada correctamente.",
    backdoorDealerBrandsSuccessDeleted: "Marca distribuidora eliminada correctamente.",
    backdoorDealerBrandsSearchPlaceholder: "Buscar marca distribuidora por nombre...",
    backdoorDealerBrandsWheelPreview: "Vista Previa de la Rueda",

    // BarrialCR Community & Page
    barrialCrHeroBadge: "Comunidad Oficial",
    barrialCrScrollDown: "Desliza para explorar la comunidad",
    barrialCrAboutTitle: "Sobre la Comunidad BarrialCR",
    barrialCrRidesTitle: "Rutas & Aventuras en Costa Rica",
    barrialCrJoinChatPrompt: "¿Listo para la próxima ruta? Únete al grupo de WhatsApp oficial de BarrialCR y rueda con nosotros por Costa Rica.",
    barrialCrLoading: "Cargando comunidad BarrialCR...",
    barrialCrBadgeCommunity: "Comunidad Oficial",
    barrialCrBadgeRutas: "Rutas & Expediciones",
    barrialCrBadgeCostaRica: "Costa Rica 4x4",
    barrialCrUpcomingRidesTitle: "Próximas Rutas Oficiales BarrialCR",
    barrialCrUpcomingRidesSubtitle: "Fechas agendadas en el calendario oficial de eventos. Prepara tu vehículo y rueda con la comunidad.",
    barrialCrNoRidesPlanned: "Próximas Rutas en Planificación",
    barrialCrNoRidesSub: "Actualmente se están trazando las próximas rutas por Costa Rica. Únete al chat oficial de WhatsApp para enterarte de las fechas antes de que se agoten los cupos.",
    barrialCrRideConfirmed: "Ruta Confirmada",
    barrialCrRideMeetingPoint: "Punto de Encuentro",
    barrialCrRideTime: "Hora de Salida",
    barrialCrRideJoinWhatsApp: "Unirme a esta Ruta (WhatsApp)",
    barrialCrRidePastBadge: "Ruta Realizada",
    barrialCrCalendarSyncNotice: "Sincronizado en tiempo real con la Agenda Oficial de ZxZ Mods",
    backdoorBarrialCrCalendarRidesTitle: "Rutas BarrialCR en la Agenda / Calendario",
    backdoorBarrialCrCalendarRidesSubtitle: "Rutas y expediciones registradas en el calendario del sistema. Al agregar o bloquear una fecha como Ruta BarrialCR en la agenda, se mostrará automáticamente en la pantalla pública de BarrialCR.",
    backdoorBarrialCrAddRideBtn: "Agendar Nueva Ruta",
    backdoorBarrialCrNoCalendarRides: "No hay rutas de BarrialCR agendadas actualmente en el calendario.",

    // Backdoor BarrialCR Manager
    backdoorHomeSubTabBarrialCr: "BarrialCR",
    backdoorBarrialCrTitle: "Gestión de Pantalla BarrialCR",
    backdoorBarrialCrSubtitle: "Configura el video de fondo, títulos, logo, descripción de la comunidad y enlace de WhatsApp para unirse al chat oficial.",
    backdoorBarrialCrHeroSettings: "Video de Fondo y Encabezado Hero",
    backdoorBarrialCrVideoUrl: "URL del Video de Fondo (MP4)",
    backdoorBarrialCrUploadVideo: "Subir Video MP4",
    backdoorBarrialCrUploadingVideo: "Subiendo video...",
    backdoorBarrialCrPosterUrl: "Imagen de Portada / Poster de Respaldo",
    backdoorBarrialCrUploadPoster: "Subir Portada",
    backdoorBarrialCrTitleLabel: "Título Centrado sobre el Video",
    backdoorBarrialCrSubtitleEs: "Subtítulo de Entrada (Español)",
    backdoorBarrialCrSubtitleEn: "Subtítulo de Entrada (Inglés)",
    backdoorBarrialCrCommunitySettings: "Información y Logo de la Comunidad",
    backdoorBarrialCrLogoUrl: "Logo Oficial de BarrialCR",
    backdoorBarrialCrUploadLogo: "Subir Logo",
    backdoorBarrialCrUploadingLogo: "Subiendo logo...",
    backdoorBarrialCrDescEs: "Descripción de la Comunidad (Español)",
    backdoorBarrialCrDescEn: "Descripción de la Comunidad (Inglés)",
    backdoorBarrialCrWhatsappLink: "Enlace de Invitación al Grupo de WhatsApp",
    backdoorBarrialCrWhatsappLinkHelp: "Ingresa el enlace de invitación oficial (ej. https://chat.whatsapp.com/... o https://wa.me/...)",
    backdoorBarrialCrWhatsappBtnEs: "Texto del Botón de WhatsApp (Español)",
    backdoorBarrialCrWhatsappBtnEn: "Texto del Botón de WhatsApp (Inglés)",
    backdoorBarrialCrStatusLabel: "Estado de la Pantalla BarrialCR",
    backdoorBarrialCrStatusActive: "Página Pública Visible y Activa",
    backdoorBarrialCrStatusInactive: "Página Oculta / Mantenimiento",
    backdoorBarrialCrSaveBtn: "Guardar Cambios de BarrialCR",
    backdoorBarrialCrSaving: "Guardando Cambios...",
    backdoorBarrialCrSuccessSaved: "¡Configuración de BarrialCR actualizada correctamente!",
    backdoorBarrialCrPreviewBtn: "Ver Pantalla BarrialCR en Vivo",
    backdoorWorkshopTab: "Sede & Teléfono",
    backdoorWorkshopTitle: "Configuración de Sede & Teléfono Global",
    backdoorWorkshopSubtitle: "Modifica la variable global de teléfono y WhatsApp, dirección y horario oficial del taller. Estos cambios se sincronizan automáticamente en toda la tienda.",
    backdoorPhoneLabel: "Variable Global de Teléfono & WhatsApp",
    backdoorPhonePlaceholder: "+506 7033-2560",
    backdoorPhoneHelp: "Variable global sincronizada en toda la tienda: pantallas de contacto, cotizaciones por WhatsApp, botones de llamada y documentos oficiales.",
    backdoorLegalNameLabel: "Razón Social / Nombre Legal de la Empresa",
    backdoorLegalNamePlaceholder: "Ej: ZxZ Mods Costa Rica S.A.",
    backdoorLegalNameHelp: "Nombre legal formal que se imprime en los comprobantes de compra, cotizaciones y documentos fiscales.",
    backdoorCedulaJuridicaLabel: "Cédula Jurídica / Identificación Fiscal",
    backdoorCedulaJuridicaPlaceholder: "Ej: 3-101-436132",
    backdoorCedulaJuridicaHelp: "Número de cédula jurídica que valida legalmente la empresa en los recibos formales de compra.",
    backdoorWhatsappLabel: "Número Oficial de WhatsApp",
    backdoorHoursLabel: "Horario de Atención",
    backdoorHoursHelp: "Horario visible al público (ej. 8:00 AM - 8:00 PM)",
    backdoorAddressLabel: "Dirección Física (Español)",
    backdoorAddressEnLabel: "Dirección Física (Inglés)",
    backdoorSaveWorkshopBtn: "Guardar Cambios de Sede",
    backdoorSavingWorkshop: "Guardando cambios...",
    backdoorWorkshopPreview: "Vista Previa en Vivo (Pantalla de Ubicación)",
    backdoorWorkshopError: "Ocurrió un error al actualizar los datos de la sede.",
    backdoorSaveContactSuccess: "Teléfono global, WhatsApp y datos de contacto sincronizados exitosamente en toda la tienda.",

    // Category multi-select
    devProductCategoriesLabel: "Categorías del Producto",
    devAddAnotherCategoryBtn: "+ Agregar otra categoría",
    devSelectCategoryToAdd: "Seleccionar categoría para agregar...",
    devNoCategoriesSelected: "Sin categorías seleccionadas",

    // Dealer Warranty Protection & Voids Warranty
    devVoidsWarrantyLabel: "Anula Garantía de Agencia",
    devVoidsWarrantyDesc: "Activa esta opción si este producto o modificación anula la garantía de fábrica o agencia del vehículo. Se mostrará el Servicio de Protección ZxZ Mods.",
    devVoidsWarrantyBadge: "Anula Garantía de Agencia",
    warrantyProtectionBannerTitle: "Servicio de Protección de Garantía de Agencia ZxZ Mods",
    warrantyProtectionBannerDesc: "¿Preocupado por la garantía de tu agencia? ZxZ Mods desinstala tus modificaciones y reinstala tus piezas originales (OEM) antes de ingresar a la agencia, cobrando únicamente la mano de obra.",
    warrantyProtectionBannerCta: "Conocer Servicio de Protección",
    warrantyProtectionPageTitle: "Servicio de Protección de Garantía de Agencia",
    warrantyProtectionPageSubtitle: "Disfruta al máximo el poder y adrenalina de tus modificaciones ZxZ Mods sin perder el respaldo ni la garantía oficial de tu agencia.",
    warrantyProtectionHowItWorksTitle: "¿Cómo Funciona el Servicio de Protección?",
    warrantyProtectionStep1Title: "1. Agenda tu Cita Pre-Agencia",
    warrantyProtectionStep1Desc: "Antes de llevar tu UTV o vehículo a su mantenimiento preventivo o revisión técnica a la agencia, contáctanos para agendar la desinstalación temporal en nuestro taller o a domicilio.",
    warrantyProtectionStep2Title: "2. Reinstalación de Piezas OEM",
    warrantyProtectionStep2Desc: "Nuestros mecánicos certificados retiran las piezas de alto rendimiento y reinstalan los componentes originales (OEM) de fábrica con máxima prolijidad y torque de fábrica.",
    warrantyProtectionStep3Title: "3. Solo Pagas la Mano de Obra",
    warrantyProtectionStep3Desc: "¡Sin sobrecostos ni cargos sorpresa! Únicamente se cancela el valor justo de las horas de mano de obra del técnico por el desmontaje y montaje original.",
    warrantyProtectionStep4Title: "4. Reinstalación Post-Agencia",
    warrantyProtectionStep4Desc: "Una vez completada la inspección o revisión en la agencia con éxito, traes de nuevo tu vehículo y reinstalamos tus mods de rendimiento a tarifa preferencial.",
    warrantyProtectionFaqTitle: "Preguntas Frecuentes",
    warrantyProtectionFaq1Q: "¿Qué tipo de piezas cubre este servicio?",
    warrantyProtectionFaq1A: "Aplica para tubos de carga (charge tubes), escapes completos, reprogramaciones ECU, kits de clutch, intercoolers, tomas de aire y cualquier accesorio de rendimiento identificado con aviso de anulación de garantía.",
    warrantyProtectionFaq2Q: "¿Cuánto demora el proceso de desmontaje y montaje OEM?",
    warrantyProtectionFaq2A: "La mayoría de desinstalaciones e intercambios OEM toman entre 2 y 4 horas en nuestro taller especializado o servicio a domicilio, dependiendo del nivel de preparación.",
    warrantyProtectionFaq3Q: "¿Qué debo hacer con las piezas originales que retiré al comprar el producto?",
    warrantyProtectionFaq3A: "Consérvalas en tu garaje o déjalas en custodia temporal en nuestro taller para tenerlas listas el día de tu cita previa a la agencia.",
    warrantyProtectionContactBtn: "Coordinar Protección de Garantía por WhatsApp",
    warrantyProtectionBackBtn: "Volver a Productos",
    warrantyProtectionProfileBtn: "Protección de Garantía",
    warrantyProtectionProfileSubtitle: "Desinstalación y reinstalación de piezas que anulan garantía",
    warrantyProtectionPartsTitle: "Piezas Registradas con Protección de Garantía",
    warrantyProtectionPartsSubtitle: "Tus piezas ZxZ que anulan garantía de agencia, listas para desinstalación y reinstalación",
    warrantyProtectionCostFormula: "Costo Desinstalación & Reinstalación (Instalación × 2)",
    warrantyProtectionInstallCostLabel: "Instalación base:",
    warrantyProtectionDeinstallReinstallLabel: "Desinstalación + Reinstalación [Instalación × 2]:",
    warrantyProtectionSelectParts: "Seleccionar piezas para el proceso",
    warrantyProtectionProceedService: "Continuar a Selección de Servicio (Taller, Domicilio, Plataforma)",
    warrantyProtectionGoToScreen: "Conocer más sobre el Servicio de Protección",
    warrantyProtectionNoParts: "Aún no tienes piezas registradas que anulen la garantía de agencia",
    warrantyProtectionNoPartsDesc: "Cuando compres piezas de alto rendimiento en ZxZ Mods (escapes deportivos, reprogramaciones ECU, clutch kits), se registrarán automáticamente aquí para proteger tu garantía de agencia.",
    warrantyProtectionOnlyZxzNotice: "Solo piezas compradas en ZxZ Mods pueden ser desinstaladas y reinstaladas bajo este servicio.",
    warrantyProtectionTotalToPay: "Total Mano de Obra (Desinstalación + Reinstalación):",
    warrantyProtectionCreatingOrder: "Preparando orden de servicio...",
    warrantyProtectionLoginRequired: "Inicia sesión para gestionar las piezas de tu vehículo",
    warrantyProtectionLoginPrompt: "Accede con tu cuenta para visualizar las piezas compradas en ZxZ Mods con protección de garantía de agencia.",
    warrantyProtectionExploreCatalog: "Explorar Catálogo de Rendimiento",
    warrantyProtectionSelectedCount: "piezas seleccionadas",

    // Related / Recommended Products
    devRelatedProductsTitle: "Productos Altamente Relacionados (Recomendados)",
    devRelatedProductsDesc: "Selecciona piezas recomendadas o complementarias que se mostrarán en la página del producto para venta cruzada.",
    devAddRelatedProductPlaceholder: "Buscar y agregar producto relacionado...",
    devNoRelatedProducts: "No hay productos relacionados asignados aún.",
    productRelatedTitle: "Productos Recomendados & Complementarios",
    productRelatedSubtitle: "Mejoras sugeridas por el equipo técnico de ZxZ Mods para complementar este producto.",

    // Suggested Products & Combos (For function & damage prevention - distinct from recommended)
    productSuggestionsSectionTitle: "Sugeridos para Mejor Funcionamiento y Prevención",
    productSuggestionsSectionSubtitle: "Componentes sugeridos para prevenir fallas o desgaste y garantizar un funcionamiento óptimo.",
    suggestionTypeProduct: "Producto Sugerido",
    suggestionTypeCombo: "Combo Sugerido",
    suggestionBadge: "Prevención & Rendimiento",
    suggestionAddToCart: "+ Agregar",
    suggestionInCart: "En carrito",
    suggestionAddedSuccess: "¡Agregado al carrito!",
    devSuggestionsTitle: "Sugeridos (Prevención de Daños & Rendimiento Óptimo)",
    devSuggestionsDesc: "Etiqueta productos o combos sugeridos para evitar daños o garantizar el mejor funcionamiento de esta pieza.",
    devSuggestionsSearchPlaceholder: "Buscar producto o combo para sugerir...",
    devNoSuggestionsTagged: "Sin productos o combos sugeridos etiquetados.",
    devTagTypeAll: "Todos",
    devTagTypeProducts: "Productos",
    devTagTypeCombos: "Combos",

    // Description bullet helper
    devBulletListHelp: "Consejo: Inicia líneas con guión '- ' o viñeta '• ' para generar automáticamente listas con puntos estéticos en la tienda.",
    devAddBulletTemplateBtn: "+ Insertar Viñeta",

    // Product percentage discount
    devProductDiscountPercent: "Descuento del Producto (% OFF)",
    devProductDiscountHelp: "Aplica un descuento porcentual directo al precio final de venta del producto.",
    devProductBasePrice: "Precio Base Calculado (sin descuento)",
    devProductDiscountAmount: "Monto de Descuento",
    devProductFinalPrice: "Precio Final con Descuento",
    devProductNoDiscount: "Sin Descuento (0%)",

    // Profile Banning System (Master Only)
    backdoorUserBansTab: "Baneo de Perfiles",
    userBanTitle: "Control de Baneo de Perfiles (Exclusivo Master)",
    userBanSubtitle: "Herramienta de seguridad para suspender o reactivar usuarios de la plataforma en tiempo real.",
    userBanSearchPlaceholder: "Escribe el correo electrónico del usuario...",
    userBanSearchHelp: "Para reducir consultas a la base de datos, la búsqueda solo se ejecuta al ingresar el correo.",
    userBanNoUserFound: "No se encontró ningún usuario registrado con el correo especificado.",
    userBanInitialStatePrompt: "Escribe un correo electrónico arriba para buscar el perfil y gestionar su estado de baneo.",
    userBanActiveStatus: "Activo (Sin Restricciones)",
    userBanBannedStatus: "Baneado / Suspendido",
    userBanDateLabel: "Fecha de Suspensión",
    userBanReasonLabel: "Motivo del Baneo",
    userBanByLabel: "Baneado por",
    userBanActionBanBtn: "Banear Usuario",
    userBanActionUnbanBtn: "Levantar Baneo / Reactivar",
    userBanModalTitle: "Confirmar Baneo de Perfil",
    userBanModalSubtitle: "El usuario perderá acceso inmediato a la tienda, no podrá iniciar sesión y sus pedidos quedarán congelados.",
    userBanReasonPrompt: "Motivo o Justificación del Baneo:",
    userBanReasonPlaceholder: "Ej: Violación de términos, fraude con comprobantes, comportamiento abusivo...",
    userBanConfirmBanBtn: "Confirmar y Banear Usuario",
    userBanConfirmUnbanBtn: "Confirmar y Reactivar Usuario",
    userBanCancelBtn: "Cancelar",
    userBanSuccessBan: "El usuario ha sido baneado y suspendido exitosamente.",
    userBanSuccessUnban: "La suspensión del usuario ha sido levantada exitosamente.",
    userBanRegisteredAt: "Fecha de Registro",
    userBanLastLogin: "Último Acceso",
    userBanOrdersCount: "Total Pedidos",
    userBanVehiclesCount: "Vehículos en Garaje",
    userBanPhoneLabel: "Teléfono",
    userBanRoleLabel: "Rol en Sistema",
    userBanCannotBanSelf: "Acción bloqueada: No puedes banear tu propia cuenta Master.",
    userBanCannotBanMaster: "Acción bloqueada: No se puede banear a un usuario con rol MASTER.",
    userBanDefaultReason: "Suspensión administrativa por Master.",
    userBanAccountSuspendedNotice: "Tu cuenta ha sido suspendida. Si consideras que esto es un error, contacta a soporte.",

    // Physical Service Documents & PDF System
    serviceDocsBtn: "Documentos de Servicio (PDF / Impresión)",
    serviceDocsModalTitle: "Documentos de Servicio Físicos & Legales",
    serviceDocsModalSubtitle: "Emisión de comprobantes físicos, boletas de recepción, actas de entrega y acuerdos legales según el servicio.",
    serviceDocsTabReception: "Recepción de Vehículo",
    serviceDocsTabHandover: "Entrega de Vehículo",
    serviceDocsTabAgreement: "Acuerdo e Instalación",
    serviceDocsTabTransportAuth: "Permiso de Traslado",
    serviceDocsTabTransportReturn: "Retorno de Vehículo",
    serviceDocsTabDelivery: "Guía de Entrega",
    serviceDocsPrintBtn: "Imprimir / Guardar como PDF",
    serviceDocsFillDetails: "Completar Datos del Vehículo / Documento",
    serviceDocsLicensePlate: "Número de Placa",
    serviceDocsVin: "VIN / Chasis",
    serviceDocsMileage: "Horas / Kilometraje",
    serviceDocsVehicleColor: "Color de Vehículo",
    serviceDocsReceiverName: "Funcionario / Mecánico que Recibe",
    serviceDocsPreDamages: "Inspección de Daños Previos (Rayones, golpes, etc.)",
    serviceDocsFreeWash: "Lavado de Cortesía Incluido",
    serviceDocsFreeWashYes: "Sí, cliente solicita lavado de cortesía gratuito",
    serviceDocsFreeWashNo: "No, cliente no desea lavado",
    serviceDocsCedulaLabel: "Cédula / Documento de Identidad",
    serviceDocsOwnerNameLabel: "Nombre del Propietario / Cliente",
    serviceDocsSignOwner: "Firma del Propietario / Cliente",
    serviceDocsSignStaff: "Firma y Sello ZxZ Mods",
    serviceDocsSaveDataBtn: "Guardar Datos de Documento",
    serviceDocsSaveSuccess: "Datos del documento guardados correctamente en la orden.",
    serviceDocsKeysCheck: "Llaves del vehículo recibidas",
    serviceDocsSpareKeyCheck: "Llave de repuesto recibida",
    serviceDocsKeysCount: "Cantidad de llaves",
    serviceDocsFuelLevel: "Nivel de combustible",
    serviceDocsNoBelongings: "Sin pertenencias personales en cabina",
    serviceDocsBatteryCheck: "Batería y encendido operativos",
    serviceDocsParkingBrakeCheck: "Freno de estacionamiento operativo",
    serviceDocsTiresCheck: "Neumáticos y aros en buen estado",
    serviceDocsLeaksCheck: "Sin fugas visibles de fluidos",
    serviceDocsDocsCheck: "Documentos del vehículo a bordo",
    serviceDocsKeysReturnedCheck: "Devolución formal de llaves del vehículo al propietario",

    // ZxZ Quality Certification (Warehouse Product Checked)
    zxzCertBadge: "Certificado de Calidad ZxZ",
    zxzCertTitle: "Certificado de Inspección de Bodega & Calidad ZxZ",
    zxzCertSubtitle: "Documento oficial que certifica que los productos fueron recibidos, revisados técnicamente y aprobados sin defectos en bodega.",
    zxzCertViewBtn: "Ver Certificado de Calidad ZxZ",
    zxzCertDownloadBtn: "Imprimir / Guardar Certificado",
    zxzCertInspector: "Técnico Inspector",
    zxzCertStatusVerified: "Verificado y Aprobado",
    zxzCertCustomerBannerTitle: "Mercadería Inspeccionada y Certificada en Taller ZxZ",
    zxzCertCustomerBannerSub: "Tus piezas fueron desempaquetadas, revisadas por el equipo técnico y cuentan con sello de conformidad ZxZ Mods.",

    // Pick-Up Service Enable/Disable by Master
    servicePickupDisabledBadge: "No Disponible",
    servicePickupDisabledDesc: "Servicio de plataforma temporalmente fuera de servicio por mantenimiento de unidad.",
    servicePickupDisabledAlert: "El servicio de Pick-up de vehículo se encuentra deshabilitado temporalmente por mantenimiento de nuestra unidad de transporte. Puedes agendar Instalación en Taller, Instalación a Domicilio o Envío de Repuestos.",
    backdoorPickupStatusLabel: "Disponibilidad del Servicio Pick-Up",
    backdoorPickupEnabledBadge: "HABILITADO",
    backdoorPickupDisabledBadge: "DESHABILITADO",
    backdoorPickupEnableBtn: "Habilitar Servicio Pick-Up",
    backdoorPickupDisableBtn: "Deshabilitar Servicio Pick-Up",
    backdoorPickupToggleDesc: "Control exclusivo Master: Desactiva el servicio de Pick-up si el vehículo o remolque de transporte se encuentra en mantenimiento o fuera de operación.",

    // Common Breadcrumbs & Navigation
    breadcrumbHome: "Inicio",
    breadcrumbBrands: "Marcas",
    breadcrumbPerformance: "Paquetes de Rendimiento Stage",
    breadcrumbQuote: "Cotizador de Modelo",
    breadcrumbProducts: "Productos",
    breadcrumbCombos: "Combos & Kits",
    breadcrumbOrders: "Mis Pedidos",
    breadcrumbTerms: "Términos & Condiciones",
    breadcrumbDocuments: "Documentos Oficiales",
    btnBackToHome: "Volver a Inicio",
    btnBackToOrders: "Volver a Mis Pedidos",
    btnBackToOrder: "Volver a la Orden",
    btnExploreProducts: "Explorar Productos",
    btnExploreShop: "Ir a la Tienda",
    btnComingSoon: "Próximamente",

    // Accessibility & Global Badges
    ariaClearSearch: "Limpiar búsqueda",
    ariaCloseModal: "Cerrar modal",
    ariaCloseProfile: "Cerrar perfil",
    ariaCloseCart: "Cerrar carrito",
    ariaDecreaseQty: "Reducir cantidad",
    ariaIncreaseQty: "Aumentar cantidad",
    ariaPreviousProduct: "Producto anterior",
    ariaNextProduct: "Siguiente producto",
    ariaCloseZoom: "Cerrar imagen ampliada",
    badgeDiscountOff: "% OFF",
    badgeAudioHd: "Audio HD",
    badgeActiveStatus: "Activo",
    labelQuantityShort: "Cant:",
    labelUnitEach: "c/u",
    currencyColonesLabel: "Colones (₡ CRC)",
    currencyDollarsLabel: "Dólares ($ USD)",
    exchangeRateBccrPrefix: "TC BCCR:",
    vatIncludedNotice: "IVA incluido",
    warrantyLaborNotice: "Incluye garantía de mano de obra en taller",
    redirectingToOrderClaim: "Redirigiendo a canje de pedido...",

    // Performance Page (/performance)
    performanceBadge: "Calibración & Dyno Tuning",
    performancePageTitle: "Paquetes de Rendimiento Stage 1 a 3",
    performancePageSubtitle: "Niveles de potencia probados en dinamómetro para UTVs y ATVs. Reprogramación de software, embrague, admisión y escapes de alto flujo en Costa Rica.",
    performanceQuoteCustomBtn: "Cotizar Paquete Personalizado",
    performanceMostPopular: "Más Popular",
    performanceHpGainLabel: "Ganancia HP",
    performanceTorqueGainLabel: "Ganancia Torque",
    performanceIncludesLabel: "Incluye en el Paquete:",
    performanceDynoBadge: "Calibrado en Dyno",
    performanceLaborWarrantyBadge: "Garantía Labor ZxZ",
    performancePricePrefix: "Precio en Costa Rica:",
    performanceInstallationIncludedNotice: "Mano de obra de instalación incluida en taller",
    performanceAddToCartBtn: "Agregar al Carrito",
    performanceAppliesToLabel: "Aplica para:",

    // Quote Page (/cotizar)
    quoteBadge: "Cotización Directa & Importación",
    quotePageTitle: "Cotiza Piezas y Modificaciones para tu Modelo",
    quotePageSubtitle: "Selecciona tu máquina exacta. Te enviaremos una proforma con costos de producto en EE.UU., impuestos de aduana en Costa Rica y opción de instalación en nuestro taller.",
    quoteStep1Title: "1. Configura tu Vehículo",
    quoteYearLabel: "Año",
    quoteSelectYear: "Seleccionar Año",
    quoteMakeLabel: "Marca",
    quoteSelectMake: "Seleccionar Marca",
    quoteModelLabel: "Modelo",
    quoteSelectModel: "Seleccionar Modelo",
    quoteStep2Title: "2. ¿Qué tipo de cotización deseas?",
    quoteInterestPackageTitle: "Paquete Stage de Rendimiento",
    quoteInterestPackageDesc: "Potencia, repro de ECU, escape, faja y calibración de clutch.",
    quoteInterestPartsTitle: "Piezas Específicas / Bolt-on",
    quoteInterestPartsDesc: "Brazos, compensadores, aros, llantas, jaulas, defensas o barras LED.",
    quoteInterestMaintenanceTitle: "Mantenimiento & Repuestos",
    quoteInterestMaintenanceDesc: "Fajas, filtros, aceites, rótulas, bushings, roles y frenos.",
    quoteInterestCustomTitle: "Pieza Especial de EE.UU.",
    quoteInterestCustomDesc: "Tienes un link o número de parte de EE.UU. que deseas importar.",
    quoteSpecificDetailsLabel: "Detalles específicos o links de la parte (Opcional)",
    quoteSpecificDetailsPlaceholder: "Ejemplo: Deseo cotizar faja G-Boost y brazos delanteros tubulares, o link de tienda en EE.UU...",
    quoteWorkshopIncludeLabel: "Incluir costo de instalación en Taller ZxZ",
    quoteWorkshopWarrantyNotice: "Garantía de 60 días en mecánica y 90 días en accesorios bolt-on",
    quoteWorkshopLocationBadge: "Taller Santa Ana",
    quoteStep3Title: "3. Tus Datos de Contacto",
    quoteClientNameLabel: "Nombre Completo",
    quoteClientNamePlaceholder: "Tu nombre",
    quoteClientPhoneLabel: "Número de Teléfono / WhatsApp",
    quoteClientPhonePlaceholder: "Ej: 8888-9999",
    quoteImmediateResponseNotice: "Respuesta técnica inmediata por asesores certificados en Costa Rica",
    quoteSubmitWhatsappBtn: "Enviar Cotización por WhatsApp",
    quoteAlertSelectVehicle: "Por favor selecciona año, marca y modelo de tu vehículo.",
    quoteAlertFillContact: "Por favor ingresa tu nombre y teléfono para procesar la cotización.",

    // Documents Page (/documentos)
    docsOfficialPortalTitle: "Portal Oficial ZxZ Mods Costa Rica S.A.",
    docsWarranty60DaysTitle: "60 Días Mano de Obra",
    docsWarranty60DaysDesc: "Garantía por escrito en ensamble, torques y calibraciones en taller y a domicilio.",
    docsWarranty90DaysTitle: "90 Días Partes Bolt-On",
    docsWarranty90DaysDesc: "Protección contra fallos de fábrica comprobados en componentes mecánicos.",
    docsWarrantyEcuTitle: "Archivo ECU de por Vida",
    docsWarrantyEcuDesc: "Respaldo permanente y re-flasheo gratuito si la agencia actualiza la computadora.",
    docsDocumentOfficialPrefix: "DOCUMENTO OFICIAL #",
    docsActiveLabel: "Vigente:",
    docsJurisdictionLabel: "Jurisdicción:",
    docsJurisdictionValue: "República de Costa Rica (Leyes MEIC y Código de Comercio)",
    docsCorporateName: "ZxZ Mods Costa Rica S.A.",
    docsLegalIdNotice: "Cédula Jurídica registrada • San José, Costa Rica",
    docsCloseModal: "Cerrar",
    docsLastUpdated: "Última actualización:",
    docsLoading: "Cargando documento...",
    docsDefaultTitle: "Documento Legal",

    // Order Claim (/pedidos/reclamar/[token])
    claimInvalidLinkTitle: "Enlace no disponible",
    claimInvalidLinkDesc: "El enlace de canje ya fue utilizado, ha expirado o no es válido.",
    claimViewProfileBtn: "Ver Mi Perfil & Pedidos",
    claimGoToStoreBtn: "Ir a la Tienda",
    claimSuccessTitle: "¡Pedido Canjeado con Éxito!",
    claimOrderLinkedBadge: "Vinculado",
    claimOrderSuccessDesc: "Este pedido ha sido registrado permanentemente a tu cuenta. Podrás seguir el avance y estado de tus piezas desde tu perfil.",
    claimViewInMyAccountBtn: "Ver en Mi Cuenta",
    claimSpecialQuoteHeader: "Canje de Pedido / Cotización Especial",
    claimOrderNumberPrefix: "Pedido #",
    claimOrderTotalLabel: "Total Cotizado:",
    claimItemsListLabel: "Detalle de Artículos Incluidos:",
    claimItemDefaultTitle: "Pieza de Rendimiento",

    // Installation Checkout (/pedidos/[id]/pagar-instalacion)
    instCheckoutHeader: "CHECKOUT DE INSTALACIÓN",
    instCheckoutSubtitle: "Pago de Instalación & Mano de Obra",
    instCheckoutDesc: "Cancela únicamente el costo de instalación y mano de obra para que el equipo técnico proceda con el montaje.",
    instLaborSubtotal: "Mano de Obra Neta",
    instVatIncluded: "IVA (13% incluido)",
    instTotalAmount: "Monto de Instalación (IVA inc.)",
    instBreakdownTitle: "Desglose de Mano de Obra",
    instOfficialAccountsTitle: "Cuentas Bancarias Oficiales (IBAN)",
    instOfficialAccountsSub: "Transfiere el monto exacto e ingresa el comprobante a continuación.",
    instUploadProofTitle: "Subir Comprobante de Mano de Obra",
    instDropzonePrompt: "Haz clic o arrastra tu comprobante aquí",
    instPhoneRequired: "Teléfono de Contacto Obligatorio",
    instPhoneBadgeRequired: "Obligatorio",
    instAlreadyConfirmed: "Pago de Instalación ya Confirmado",
    instUnderReview: "Comprobante en Revisión Administrativa",
    instNotAvailableYet: "Pago de Instalación No Disponible Aún",
    instMaxFileSizeError: "El archivo supera el límite de 100MB.",
    instUploadingProof: "Subiendo Comprobante...",
    instRegisteringPayment: "Registrando Pago de Instalación...",
    instPaymentSuccess: "¡Comprobante de Instalación Registrado!",
    instVerifiedAccountsBadge: "Cuentas Verificadas",

    // Home Page Sections
    homeNavigatingAdapted: "Navegando catálogo adaptado a tu:",
    homeCostaRicaHq: "CENTRO DE OPERACIONES COSTA RICA",
    homeHqSubtitle: "Santa Ana, San José • Instalación Especializada",
    homeSpecializedBrandsTitle: "Plataformas & Fabricantes Especializados",
    homeConfigureFullVehicle: "Configurar Vehículo Completo",
    homeModelsCountLabel: "Modelos",
    homePopularModelsLabel: "Modelos Populares:",
    homeCombosSectionSubtitle: "Kits y Paquetes Listos para Montar",
    homeCombosNetPriceNotice: "Precios netos en Colones (Costa Rica)",
    homePerformanceSectionSubtitle: "Niveles de Potencia y Preparación Mecánica",
    homePerformanceMaxPower: "MÁXIMA POTENCIA",
    homeWorkshopSubtitle: "Instalación Profesional & Respaldos en Costa Rica",
    homeWorkshopPhysicalTitle: "SEDE FÍSICA & TALLER ZXZ",
    homeWorkshopAddressLabel: "Dirección:",
    homeWorkshopPhoneLabel: "Teléfono:",
    homeProductShowcasePrevious: "Anterior",
    homeProductShowcaseNext: "Siguiente",
    homeProductShowcaseViewMore: "Ver Más",

    // Catalog Pagination
    paginationShowing: "Mostrando",
    paginationOf: "de",
    paginationPrevious: "Anterior",
    paginationNext: "Siguiente",
    paginationPage: "Página",
  },

  en: {
    brandName: "ZxZ Mods",
    tagline: "CFMOTO Specialists, UTV & ATV Performance, Modifications & US Imports",
    subTagline: "Specialized technical workshop in Costa Rica. High-performance parts imported from the US with certified in-shop installation and real warranties.",
    cfmotoBadge: "CFMOTO SPECIALTY",

    navCfmoto: "CFMOTO Specialty",
    navBrands: "Brands",
    navCombos: "Combos",
    navPerformance: "Performance",
    navWorkshop: "Location",
    navBarrialCr: "BarrialCR",
    navQuote: "At-Home Installation",
    navGarage: "Garage",
    navMyVehicle: "Active Vehicle",
    navNoVehicle: "Set Vehicle",
    navChangeVehicle: "Change",
    navCart: "Cart",
    navDeliveryQuote: "Delivery Quote",
    navUtvPickup: "UTV Pick-Up Service",
    navHomeService: "At-Home Installation",
    navHomeInstallation: "At-Home Installation",
    navProfile: "My Account",

    // Authentication & Profile (Firebase Auth & Orders)
    authModalTitle: "Sign In to ZxZ Mods",
    authModalSubtitle: "Manage your orders, garage fleet, and technical preferences",
    authGoogleButton: "Continue with Google",
    authOrDivider: "or with email address",
    authFullNameLabel: "Full Name",
    authFullNamePlaceholder: "e.g. John Doe",
    authFullNameRequired: "Please enter your full name",
    authEmailPlaceholder: "name@example.com",
    authSendCodeButton: "Send Verification Code",
    authEnterCode: "Enter the 6-digit code sent to",
    authVerifyButton: "Verify & Sign In",
    authResendCode: "Didn't receive it? Resend code",
    authChangeEmail: "Change email",
    authCodeSentTo: "Code sent to",
    authInvalidCode: "The code entered is invalid or expired.",
    authSendingCode: "Sending code...",
    authVerifying: "Verifying...",
    authPromptReasonTitle: "Sign In Required",
    authGatingGarageReason: "Please sign in to save and sync your vehicle to your Garage.",
    authGatingCartReason: "Please sign in to add parts and combos to your shopping cart.",
    authGatingServiceReason: "Please sign in to schedule your technical service, pickup, or home installation.",
    authTermsAgreementPrefix: "By continuing, you accept our",
    authTermsAgreementLink: "Terms and Conditions of Service",
    authTermsModalTitle: "Terms and Conditions of Service",
    authTermsAcceptBtn: "Accept Terms",
    termsNavTitle: "Terms of Service",
    termsPageTitle: "Terms and Conditions of Service",
    termsPageSubtitle: "Warranty policies, parts importation, workshop services, and terms of use for ZxZ Mods in Costa Rica.",
    docsNavTitle: "Legal Center & Documents",
    docsPageTitle: "Legal Documentation & Policies Center",
    docsPageSubtitle: "Binding contracts, written warranty policies, bank transfer rules, and consumer protection regulations under Costa Rican law.",
    docsSearchPlaceholder: "Search by keyword or term...",
    docsIndexTitle: "Official Documents",
    docsOfficialStamp: "ZxZ Mods Costa Rica S.A. • Official Registered Document",
    docsNoResults: "No documents found matching this keyword.",
    docsPrintBtn: "Save or Print Official Copy",
    docsShareBtn: "Share",
    docsShareCopied: "Link Copied!",
    docsExecutiveSummary: "Executive Summary & Scope:",
    docsLegalFramework: "Legal Framework in Costa Rica:",
    docsContactAdvisor: "Contact Advisor",
    docsUnderstoodClose: "Understood & Close",
    profileTitle: "Profile & Orders",
    profileOrdersTab: "My Orders",
    profileInfoTab: "My Details",
    profileNoOrders: "No registered orders yet",
    profileNoOrdersDesc: "When you place orders or quotations from the cart they will appear here.",
    profileExploreParts: "Browse Products",
    profileLogout: "Sign Out",
    profileLoggedInAs: "Signed in as",
    profileVehicles: "Saved Vehicles",
    profileFullName: "Full Name",
    profileNamePlaceholder: "Add your full name",
    profileNoNameSet: "No name configured",
    profileActiveCart: "Shopping Cart",
    profileViewCart: "View Cart",
    profileCartOrderInProgress: "You have items ready in your cart to create an order",
    profileEmail: "Email Address",
    profilePhone: "Phone / WhatsApp",
    profilePhonePlaceholder: "+506 8888-8888",
    profileSave: "Save Changes",
    profileSaving: "Saving...",
    profileSavedSuccess: "Information updated successfully.",
    orderNumberLabel: "Order #",
    orderDateLabel: "Date",
    orderStatusLabel: "Status",
    orderTotalLabel: "Total",
    orderItemsLabel: "Items",
    ordersPageTitle: "My Orders",
    ordersPageSubtitle: "Check real-time status, parts tracking, and technical workshop progression.",
    ordersSearchPlaceholder: "Search by order #, client, or item...",
    ordersAuthRequiredTitle: "Sign In to View Your Orders",
    ordersAuthRequiredSubtitle: "Access your account to check order history and workshop status.",
    ordersSignInBtn: "Sign In",
    ordersContactWhatsApp: "Inquire via WhatsApp",
    ordersDeliveryService: "Service / Delivery",
    ordersItemsLabel: "Order Items",
    ordersSummaryLabel: "Order Summary",
    ordersRedirectBtn: "View My Orders",
    ordersViewTracking: "View status & tracking",

    // Scheduled Services Screen (User requirement)
    scheduledServicesTitle: "Scheduled Services",
    scheduledServicesSubtitle: "Review your installation, delivery, and workshop appointments, reschedule dates with more than 48 hours notice, and communicate with the team.",
    scheduledServicesNoItems: "You currently have no scheduled services",
    scheduledServicesNoItemsDesc: "When you book a home installation, delivery, or workshop service, you will be able to view and manage your appointment here.",
    scheduledServicesBookBtn: "Book a Service",
    scheduledServicesAuthRequired: "Sign in to view your scheduled services",
    scheduledServicesAuthDesc: "Access your account to view and manage your service and delivery appointments.",
    scheduledServicesBadgeCanEdit: "Editable (>48h)",
    scheduledServicesBadgeLocked: "Date Locked (<48h)",
    scheduledServicesHoursRemaining: "hours remaining",
    scheduledServicesHoursToDelivery: "Time until delivery/service",
    scheduledServicesLockedNotice: "Date and time cannot be modified with less than 48 hours notice before delivery. For urgent requests, contact the workshop directly.",
    scheduledServicesCanEditNotice: "You can reschedule the date or time for this appointment because there are more than 48 hours until delivery/service.",
    scheduledServicesEditDateTime: "Reschedule Date & Time",
    scheduledServicesModalTitle: "Reschedule Service Appointment",
    scheduledServicesSelectDate: "New Date",
    scheduledServicesSelectTime: "New Time",
    scheduledServicesSaveSchedule: "Confirm New Date",
    scheduledServicesCommentsTitle: "Service Comments & Notes",
    scheduledServicesCommentsSubtitle: "Communicate with the technical team regardless of the time remaining until service.",
    scheduledServicesAddCommentPlaceholder: "Write a comment, special request, or delivery note...",
    scheduledServicesPostComment: "Post Comment",
    scheduledServicesCommentPosted: "Comment posted successfully",
    scheduledServicesRescheduleSuccess: "Appointment rescheduled successfully",
    scheduledServicesRescheduleError48h: "Date or time cannot be modified with less than 48 hours notice.",
    scheduledServicesDrawerButton: "Scheduled Services",
    scheduledServicesDrawerView: "View appointments & schedule",
    scheduledServicesAppointmentCode: "Appointment Code",
    scheduledServicesServiceTypeLabel: "Service Type",
    scheduledServicesDestinationLabel: "Destination Address",
    scheduledServicesWorkshopAddressLabel: "ZxZ Workshop Location",
    scheduledServicesLinkedOrderLabel: "Linked Order",

    orderStatusCotizacion: "Proforma Quotation",
    orderCotizacionExpiresNote: "Valid for 2 months from the latest update or payment. If not updated or paid, it will be automatically erased.",
    orderCotizacionStaffNotice: "This quotation can be edited by ZxZ Mods technical staff to add, modify, or remove any parts you request.",
    orderCotizacionEmptyNotice: "Custom quotation with no catalog items yet. Our technical staff will review your notes and add the corresponding parts.",
    orderDetailsTitle: "Order Details",
    orderDetailsSubtitle: "Full information, detailed proforma, payment management, and direct communication with the workshop.",
    orderDownloadReceipt: "Purchase receipt",
    orderReceiptTitle: "Official Purchase Receipt",
    orderReceiptSubtitle: "Formal order summary and purchase proof for your records.",
    orderReceiptPrintBtn: "Print / Save as PDF",
    orderReceiptBackToOrder: "Back to order",
    orderReceiptSoldBy: "Sold and billed by",
    orderReceiptBilledTo: "Buyer / Billed to",
    orderReceiptPaymentMethod: "Payment method",
    orderReceiptPaymentRef: "Reference / Receipt",
    orderReceiptDeliveryMethod: "Delivery method",
    orderReceiptTermsTitle: "Terms, Warranties & Conditions",
    orderReceiptWarrantyTerms: "Official 90-day warranty on bolt-on & electrical parts, 60-day warranty on mechanical & drivetrain components, and lifetime technical support on ECU software tuning.",
    orderReceiptDeliveryTerms: "US-imported parts typically take 7 to 12 business days to arrive. In-stock workshop items are available for immediate pickup or scheduled installation.",
    orderReceiptSupportNotice: "For any questions, claims, or updates regarding your order, contact us directly at ventas@zxzmods.com or via official WhatsApp at +506 7033-2560.",
    orderReceiptOfficialProof: "This document certifies that your order has been formally placed in the ZxZ Mods Costa Rica system and serves as your official proof of purchase.",
    orderProductsList: "Products & Parts List",
    orderProceedToPay: "Proceed to Payment",
    orderScheduleServiceBtn: "Schedule Service",
    orderRescheduleServiceBtn: "Reschedule Service",
    orderScheduleServiceBannerTitle: "Your order is ready to schedule service!",
    orderScheduleServiceBannerSubtitle: "Choose date and time for workshop installation, home delivery or pickup.",
    orderScheduleServicePrompt: "Your order is ready at the workshop. Schedule your service appointment to coordinate date and logistics.",
    orderPayModalTitle: "Pay Order / Quotation",
    orderPayModalSubtitle: "Choose your payment method to confirm your order and protect it from expiration.",
    orderSinpeTitle: "Official SINPE Movil",
    orderSinpeDesc: "Instant local transfer to official ZxZ Mods phone number (+506 7033-2560).",
    orderBankTransferTitle: "Bank Wire Transfer",
    orderBankTransferDesc: "IBAN accounts in CRC and USD at BCR and BAC Credomatic.",
    orderPaymentReferenceLabel: "Bank Transfer Receipt / Reference Number",
    orderPaymentPhoneLabel: "Phone number used for payment",
    orderPaymentConfirmBtn: "Confirm Payment Submission",
    orderPaymentSuccessMsg: "Payment registered successfully! Your quotation is now confirmed as an official order.",
    orderCommentsTitle: "Important Notes & Delivery Details",
    orderCommentsSubtitle: "Direct communication with ZxZ Mods technical staff. Notes are strictly reserved for critical delivery, vehicle, or technical information.",
    orderCommentPlaceholder: "Enter critical delivery details, vehicle specs, or important technical notes...",
    orderCommentSubmit: "Send Message",
    orderCommentResetsTimer: "Any comment updates the quotation and automatically renews the 2-month period.",
    orderActiveQuoteBanner: "You have an active quotation under review",
    orderViewDetailsBtn: "View Order Details",
    orderPrintProforma: "Print Proforma",
    orderBackToOrders: "Back to My Orders",
    orderPaidCurrencyBadge: "Payment currency",
    orderPaidInCRC: "Paid in Colones (₡)",
    orderPaidInUSD: "Paid in Dollars ($)",
    orderPayModalCurrencyLabel: "Payment / deposit currency:",
    orderPayModalFixTitle: "Update Payment Receipt",
    orderPayModalFixSubtitle: "Attach the new photo or screenshot of your wire transfer to verify your payment.",
    orderPayModalFixSubmitBtn: "Submit Corrected Receipt",
    orderPayModalFixDropzonePrompt: "Click or drag your new payment receipt here",
    orderUploadProofModalTitle: "Upload Payment Proof",
    orderUploadProofModalSubtitle: "Attach the photo or screenshot of your BAC payment or wire transfer to verify your order.",
    orderUploadProofDropzonePrompt: "Click or drag your payment receipt here",
    orderUploadProofSubmitBtn: "Submit Payment Proof",
    orderUploadProofSuccessMsg: "Receipt uploaded successfully! Your order has moved to Payment Confirmation.",
    orderAttachProofStaffBtn: "Attach Proof",
    orderApprovePaymentStaffBtn: "Approve Payment",
    devInstallDurationLabel: "Estimated Installation Time (Hours):",
    devInstallDurationHelp: "Time it will take to install this part/combo in workshop or at home.",
    orderInstallationDurationTitle: "Workshop Installation Duration",
    orderInstallationDurationHoursLabel: "installation hours",
    orderSaveInstallationDurationBtn: "Save Duration",
    orderInstallationDurationSavedSuccess: "Installation duration updated successfully.",
    backdoorAgendaMaxInstallsTitle: "Workshop Capacity",
    backdoorAgendaMaxInstallsBadge: "{count} concurrent vehicle(s)",
    backdoorAgendaMaxInstallsSetting: "Max Concurrent Installations:",
    backdoorAgendaMaxInstallsSaved: "Maximum installation capacity updated to {count} vehicle(s).",
    serviceCollisionCapacityReached: "Workshop maximum capacity reached ({max} concurrent vehicles during that time). Please choose another time slot.",
    serviceEstimatedInstallationBadge: "Estimated installation time: {hours}h (+30m workshop buffer)",
    serviceEstimatedInstallationDesc: "Sum of selected products in your order",
    serviceCarryoverNextDayBadge: "Continues next morning: 8:00 AM - {time}",
    backdoorAgendaDrivingTime: "Estimated driving time",
    backdoorAdjustTimeModalTitle: "Adjust Installation Time & Time Sheet",
    backdoorAdjustTimeSheet: "Time Sheet (8:00 AM - 8:00 PM)",
    backdoorAdjustDurationLabel: "Workshop Installation Duration",
    backdoorAdjustSaveBtn: "Save Schedule & Duration",
    backdoorMasterOnlyCapacity: "Only users with Master role can change concurrent installations capacity.",
    orderAlertAdvancedTitle: "Order #{orderNumber} Advanced",
    orderAlertUpdatedTitle: "Order #{orderNumber} Updated",
    orderAlertAdvancedDesc: "Your order advanced to: {stage}",
    orderAlertUpdatedDesc: "Your order status has been updated.",
    orderAlertRejectedTitle: "Payment Rejected - Order #{orderNumber}",
    orderAlertRejectedDesc: "Your payment receipt was rejected. Click here to fix payment and continue with your order.",
    orderAlertFixPaymentBtn: "Fix Payment",
    orderAlertViewOrderBtn: "View Order",
    orderAlertDismissBtn: "Close",
    orderAlertProgramServiceTitle: "Schedule Your Service! - Order #{orderNumber}",
    orderAlertProgramServiceDesc: "Your parts are ready at the workshop. Please schedule your appointment date and time to proceed.",
    orderAlertProgramServiceBtn: "Schedule Service",

    bannerTitle: "Looking for parts for a specific ride? Select your vehicle to check exact fitment.",
    bannerTitleShort: "Looking for parts for your ride?",
    bannerAction: "Set Vehicle",
    bannerActionShort: "Set Up",
    bannerDismiss: "Dismiss",

    heroCategory: "Specialized Performance Center in Costa Rica",
    heroTitle: "ZXZ MODS PERFORMANCE",
    heroSubtitle: "Take Your CFMOTO, Can-Am or Polaris to the Next Level",
    heroLearnMore: "Learn More",
    heroBuyNow: "Get Quote",
    heroQuoteBtn: "Request Quote",
    videoPlaceholderNote: "Reserved space for high-definition video (Coming Soon)",
    heroBadge: "UTV/ATV Performance Hub Costa Rica",
    heroHighlight: "ZxZ Mods",
    heroDescription: "Direct importation of aftermarket powersports parts from the United States. Real availability, expert technical guidance, certified installation, and transparent labor warranties.",
    heroExploreBtn: "Explore Brands & Models",
    heroWhatsAppBtn: "Quick Quote via WhatsApp",
    heroMetric1Label: "Bolt-On Warranty",
    heroMetric1Value: "90 Days",
    heroMetric2Label: "5+ Installs Discount",
    heroMetric2Value: "15% OFF",
    heroMetric3Label: "ECU Tune Warranty",
    heroMetric3Value: "Lifetime File",

    brandsTitle: "Shop by Brand",
    brandsSubtitle: "Access verified parts and custom combos engineered specifically for your platform.",
    brandsViewModels: "View Compatible Models",
    brandsSectionTitle: "Premier Brands & Top Models",
    brandsSectionSubtitle: "Access verified parts, performance packages, and custom quotes for your exact platform.",
    cfmotoSpecialityNote: "Our #1 specialty in Costa Rica: Engine builds, ECU remapping, and heavy-duty clutching for CFMOTO ZForce, CForce, and UForce.",
    exploreModels: "Explore Models",
    quoteThisBrand: "Quote Parts",
    dealerBrandsAriaLabel: "Authorized and distributed brands",
    dealerBrandsTooltip: "View products from {brand}",

    combosTitle: "Ready-to-Install Combos & Kits",
    combosSubtitle: "Bundled packages with special part discounts and optional professional installation.",
    combosIncludes: "Components included in this bundle:",
    comboInstallAddon: "Include professional installation at ZxZ Workshop",
    comboAddToCart: "Add Combo to Cart",
    comboOriginalPrice: "Individual value:",
    comboDiscountBadge: "Special Savings",
    combosSearchPlaceholder: "Search combos by name, part or component...",
    combosAllCategories: "All",
    combosCategoryPerformance: "Performance",
    combosCategoryRings: "Wheels & Tires",
    combosCategoryLights: "Lighting",
    combosNoResults: "No combos found matching the selected filters.",
    combosActiveVehicleNotice: "Active vehicle:",
    combosChangeVehicle: "Change",
    combosSelectVehicle: "Select vehicle",
    combosIncludesSummary: "Includes",
    comboViewDetails: "View Combo",
    comboBreadcrumb: "Combos & Kits",
    comboNotFound: "Combo not found",
    comboNotFoundDesc: "The requested combo does not exist or has been discontinued.",
    comboBackToCombos: "Back to Combos Catalog",
    comboRelatedTitle: "Other Recommended Combos",
    comboRelatedSubtitle: "Explore additional packages to boost and equip your UTV.",
    comboSavings: "You save",
    comboFitmentVerified: "Fitment and compatibility guaranteed for your vehicle",
    comboFitmentPrompt: "Set up your vehicle in the Garage to validate exact fitment",

    performanceTitle: "Stage Performance Packages",
    performanceSubtitle: "From bulletproof trail setups to extreme competition builds backed by dyno tuning.",
    stageBadge: "Stage",
    stageHpGain: "Power Gain",
    stageTorqueGain: "Estimated Torque",
    stageDynoIncluded: "Dyno Calibration Included",
    stageSelectBtn: "Quote / Add Stage",

    viewCombosBtn: "View Combos Screen",
    viewPerformanceBtn: "View Performance Packages",
    requestQuoteTitle: "Custom Proforma Quotes",
    requestQuoteSubtitle: "Select your exact vehicle model and get an itemized quote including US freight, CR customs, and optional installation.",

    garageModalTitle: "Ensure Perfect Fitment for Your Ride",
    garageModalSubtitle: "We only ask once. We save your vehicle in 'My Garage' to guarantee compatibility before adding any product to your cart.",
    garageSelectYear: "1. Select Year",
    garageSelectBrand: "2. Select Brand",
    garageSelectModel: "3. Select Model",
    garageSaveBtn: "Save Vehicle & Continue",
    garageCancelBtn: "Keep Browsing",
    garageFirstTimeNotice: "We only ask for your vehicle on your first add-to-cart action to guarantee fitment.",
    garageFitSuccess: "Compatible with your",
    garageFitWarning: "Fitment check required for",

    garageFleetTitle: "My SxS & ATV Garage",
    garageFleetSubtitle: "Manage your fleet of off-road and utility machines to verify direct catalog fitment and parts compatibility.",
    garageRegisteredCounter: "Registered Vehicles",
    garageMaxNotice: "Maximum capacity reached in your garage. Remove a vehicle to register a new one.",
    garageRegisterNewBtn: "Register New Vehicle",
    garageActiveBadge: "Active Vehicle for Fitment",
    garageSetActiveBtn: "Set as Active",
    garageActiveStatus: "Active in Session",
    garageDeleteBtn: "Delete",
    garageDeleteConfirm: "Are you sure you want to remove this vehicle from your garage?",
    garageEmptyTitle: "Your Garage is Empty",
    garageEmptySubtitle: "You don't have any SxS or ATV registered yet. Add your machine to guarantee perfect fitment and unlock platform-specific upgrades.",
    garageEmptyCta: "Register My First Vehicle",
    garageViewCompatibleParts: "View Compatible Parts",
    garageManageBreadcrumb: "Garage",
    garageRegisterBreadcrumb: "Register Vehicle",
    garageSlotsAvailable: "slots available",
    garageSlotFull: "Garage Full",
    garageYearLabel: "Model Year",
    garageBrandLabel: "Make / Manufacturer",
    garageModelLabel: "Model / Platform",
    garageCategoryLabel: "Category",
    garageNicknameField: "Vehicle Nickname or Custom Name (Optional)",
    garageNicknamePlaceholder: "E.g.: The Red Beast, X3 Turbo Baja Edition...",
    garageColorField: "Color / Graphics (Optional)",
    garageColorPlaceholder: "E.g.: Red / Black, Ghost Grey, Desert Tan...",
    garageNotesField: "Modifications or Notes (Optional)",
    garageNotesPlaceholder: "E.g.: Custom cage, 15\" beadlocks, winch...",
    garageRegisterSuccessMsg: "Vehicle registered successfully in your garage.",
    garageRegisterErrorLimit: "You have reached the maximum capacity of your garage. Please remove a vehicle before continuing.",
    garageVideogameStageTitle: "ZxZ Configurator",
    garageVideogameStageSubtitle: "Official brand emblem and platform inspection.",
    garageVideogameSelectPrompt: "Select specifications to register your vehicle",
    garageVideogameBrandFallbackBadge: "Brand Emblem",
    garageSaveVehicleCta: "Save to My Garage",
    garageCancelVehicleCta: "Cancel",
    garageBackToFleetCta: "Back to Fleet",
    garageTelemetrySpecs: "Technical Specifications",
    garageDeleteSuccess: "Vehicle removed from garage.",
    garageRegisterTitle: "Vehicle Configuration",
    garageRegisterSubtitle: "Select the model year, make, and platform to register your machine in your garage.",
    garageSelectPlaceholder: "-- Select --",
    garageBrandLogoSelectPrompt: "Select a make to display its official emblem",

    workshopTitle: "ZxZ Mods Location & Technical Center",
    workshopSubtitle: "Physical specialized workshop, service bays, and certified installation in Santa Ana, Costa Rica.",
    workshopAddressLabel: "Address",
    workshopHoursLabel: "Operating Hours",
    workshopPhoneLabel: "Phone Lines",
    workshopWhatsAppLabel: "WhatsApp Direct",
    workshopOpenMaps: "Open in Google Maps",
    workshopCall: "Call Workshop",
    locationBadge: "Technical Center & Workshop",
    locationTitle: "ZxZ Mods Location",
    locationSubtitle: "Find our technical center and workshop in Santa Ana, San Jose, Costa Rica.",
    locationGoogleMapsBtn: "Open in Google Maps",
    locationWazeBtn: "Open in Waze",
    locationCopyAddress: "Copy Address",
    locationAddressCopied: "Address copied!",
    locationBreadcrumb: "Location",
    warrantySectionTitle: "Clear Warranty Policies",
    warrantySectionSubtitle: "Your investment protected in writing with transparent local labor and manufacturer factory terms.",
    warrantyBoltOnTitle: "Bolt-On & Electrical",
    warrantyBoltOnTerm: "90 Days Labor Warranty",
    warrantyBoltOnDesc: "90 days labor warranty covering LED light bars, winches, bumpers, skid plates, and electrical accessories.",
    warrantyMechTitle: "Mechanical & Drivetrain",
    warrantyMechTerm: "60 Days Labor Warranty",
    warrantyMechDesc: "60 days labor warranty covering clutch kits, drive belts, suspension arms, axles, and drivetrain components.",
    warrantyEcuTitle: "ECU Tuning & Maps",
    warrantyEcuTerm: "Lifetime File Warranty",
    warrantyEcuDesc: "Lifetime software file guarantee on ECU calibration. Zero engine mechanical coverage due to extreme operating demands.",
    warrantyProductTitle: "Factory Product Warranty",
    warrantyProductTerm: "Official Brand Warranty",
    warrantyProductDesc: "We directly process original US manufacturer warranty claims for every imported part sold.",
    installationDiscountBanner: "Exclusive Perk!: When choosing installation for 5 or more items in your order, you receive a 15% discount strictly on total labor costs.",

    cartTitle: "Shopping Cart",
    cartEmpty: "Your cart is empty.",
    cartTotal: "Order Total:",
    cartPartsSubtotal: "Parts Subtotal:",
    cartLaborSubtotal: "Labor Subtotal:",
    cartLaborDiscount: "15% Labor Discount (5+ Installs):",
    cartCheckout: "Checkout",
    cartPayWithCreditCard: "Pay with Card",
    cartPayWithCreditCardBac: "Pay with Credit Card (BAC Compra Click)",
    cartPayWithCreditCardDesc: "Request a secure BAC Compra Click link via WhatsApp to pay with your credit or debit card.",
    cartPayWithTransfer: "Checkout",
    cartTransferSubtitle: "Bank Transfer • SINPE Móvil",
    cartBacCompraClickNotice: "Your order will be registered in Quotation status. Full order details will be sent via WhatsApp to our team to generate your secure BAC Compra Click payment link.",
    cartBacCompraClickGenerating: "Creating quotation and opening WhatsApp...",
    orderBacCompraClickBadge: "BAC Compra Click",
    orderBacCompraClickRequestedNotice: "Customer requested a BAC Compra Click payment link. Send the generated link and then advance the order to Payment Confirmation.",
    orderBacMoveToPaymentConfirmation: "Move to Payment Confirmation",
    orderBacConfirmPaymentPrompt: "Enter BAC Compra Click authorization code or receipt ref:",
    cartItemInstalled: "With ZxZ Workshop Installation",
    cartItemPartsOnly: "Parts Only (No Installation)",
    cartViewFull: "View Full Cart",
    cartCurrencyLabel: "Display Currency",
    cartCurrencyCRC: "Colones (₡ CRC)",
    cartCurrencyUSD: "US Dollars ($ USD)",
    cartLiveRateLabel: "Official daily USD sell rate disclosed by BCCR:",
    cartLiveRateOfficial: "Central Bank of Costa Rica (BCCR)",
    cartProductAddedTitle: "Product added to your cart!",
    cartProductAddedSubtitle: "Successfully added to your current selection.",
    cartContinueShopping: "Continue Browsing Parts",
    cartClearAll: "Clear Cart",
    cartClearConfirm: "Are you sure you want to remove all items from your cart?",
    cartRemoveConfirmTitle: "Remove from cart?",
    cartRemoveConfirmMessage: "Do you want to remove this product from your shopping cart?",
    cartRemoveConfirmAction: "Remove",
    cartRemoveConfirmCancel: "Cancel",
    productInCart: "in cart",
    cartOrderSummary: "Order Summary",
    cartVehicleCompatibilityTitle: "My Garage Vehicle",
    cartDiscountPerkActive: "✓ 15% labor discount applied for 5+ installed parts!",
    cartDiscountPerkPrompt: "Add {count} more item(s) with installation to unlock 15% OFF labor.",
    cartUnitPrice: "Unit Price",
    cartQuantity: "Qty",
    cartInstallation: "Workshop Installation",
    cartSubtotal: "Subtotal",
    cartActions: "Actions",
    cartEstimatedTotal: "Estimated Total",
    cartWorkshopPerk: "Certified professional installation at ZxZ Mods workshop",
    cartWarrantyPerk: "Official factory warranty on all parts",
    cartShippingPerk: "Direct delivery nationwide in Costa Rica or workshop pickup",
    cartProductBrandLabel: "Brand:",
    cartCompatibleModelsLabel: "Compatible models:",
    cartCompatibleWithGarage: "Compatible with your {vehicle}",
    cartNotVerifiedForGarage: "Not compatible with your {vehicle}",
    cartGarageAdvicePrompt: "💡 Tip: Register your SxS in My Garage as an advantage to verify exact fitment and filter accessories.",
    cartGarageAdviceBtn: "Register my SxS",
    cartHomeInstallationEligible: "Eligible for Home Installation",
    cartHomeInstallationIneligible: "ZxZ workshop only (Not eligible for home installation)",
    cartHomeInstallationCheckoutTitle: "Home Installation Service Available",
    cartHomeInstallationCheckoutDesc: "Your order includes parts that qualify for professional mobile installation at your home or garage in Costa Rica.",
    cartHomeInstallationCheckoutBadge: "Home installation available",
    cartItemFreeInstallation: "Free Installation",
    cartFree: "Free",
    cartItemPaidInServices: "Paid when selecting a service",
    cartItemPaidInServicesCheckout: "Installation: Paid when selecting a service",
    checkoutTitle: "Order Confirmation & Payment",
    checkoutSubtitle: "Verify your order and complete payment to begin.",
    checkoutPaymentProcedure: "Payment Procedure",
    checkoutPaymentProcedureDesc: "1. Transfer the total amount to the indicated account.\n2. Upload your payment receipt.\n3. Accept the terms and confirm your order.",
    checkoutAccountsTitle: "Bank Accounts",
    checkoutUploadTitle: "Upload Receipt",
    checkoutUploadDesc: "Drag and drop or click to upload your receipt (JPG, PNG).",
    checkoutTermsLabel: "I agree to the Payment Agreements and Terms & Conditions",
    checkoutConfirmBtn: "Confirm Payment & Create Order",
    checkoutConfirmingBtn: "Processing...",
    checkoutAlertExit: "You have a payment in progress. Are you sure you want to leave without confirming your order?",
    checkoutTermsModalTitle: "Payment Agreements",
    checkoutTermsModalContent: "ZxZ Mods is not responsible for transfers made to wrong accounts, incorrect amounts, or fake/illegible receipts sent by the user. By proceeding, you confirm the payment information is accurate and exempt the company from any errors in the payment procedure.",
    checkoutPhoneLabel: "Phone Number / WhatsApp",
    checkoutPhonePlaceholder: "Ex: +1 555 555 5555",
    checkoutPhoneDesc: "So we can contact you when your order is ready for delivery or installation.",

    // Factura Electrónica & Order Discounts
    orderDiscountApplied: "Discount Applied",
    orderFacturaTaxLabel: "13% VAT (included in total)",
    orderFacturaDetailsTitle: "Electronic Invoice Tax Details (Hacienda CR)",
    orderFacturaCompany: "Company / Legal Name",
    orderFacturaId: "Tax ID",
    orderFacturaEmail: "Billing Email",
    orderFacturaPhone: "Billing Phone",
    orderFacturaEconomicActivity: "Economic Activity",
    orderFacturaNotes: "Tax Address / Notes",
    checkoutFacturaToggle: "Request Electronic Invoice (Hacienda CR)",
    checkoutFacturaSubtitle: "Official tax invoice for Costa Rica Hacienda. 13% VAT is already included in prices, no additional surcharge.",
    checkoutFacturaCompanyLabel: "Company or Legal Name",
    checkoutFacturaCompanyPlaceholder: "e.g. My Company Inc. or Full Name",
    checkoutFacturaIdTypeLabel: "Tax ID Type",
    checkoutFacturaIdTypeJuridica: "Corporate ID",
    checkoutFacturaIdTypeFisica: "Physical ID",
    checkoutFacturaIdTypeDimex: "DIMEX",
    checkoutFacturaIdTypeNite: "NITE",
    checkoutFacturaIdNumberLabel: "Tax ID Number",
    checkoutFacturaIdNumberPlaceholder: "e.g. 3-101-436132 or 1-1234-0567",
    checkoutFacturaEmailLabel: "Billing Email",
    checkoutFacturaEmailPlaceholder: "billing@mycompany.com",
    checkoutFacturaPhoneLabel: "Billing Phone (Different from delivery contact phone)",
    checkoutFacturaPhonePlaceholder: "+506 2222 2222 (Administrative phone)",
    checkoutFacturaEconomicActivityLabel: "Economic Activity (Hacienda)",
    checkoutFacturaEconomicActivityPlaceholder: "e.g. 453001 - Sale of motor vehicle parts and accessories",
    checkoutFacturaDetailsLabel: "Tax Address / Additional Details (Optional)",
    checkoutFacturaDetailsPlaceholder: "Province, canton, district or fiscal landmarks...",
    checkoutFacturaTaxBadge: "13% VAT Already Included",
    checkoutFacturaRequiredError: "Please fill in all required Electronic Invoice fields.",
    checkoutFacturaSamePhoneError: "The billing phone must be different from the order contact phone.",

    // Add-To-Cart Recommendations Modal
    cartAddedModalTitle: "Product Added to Cart!",
    cartAddedModalFrequentlyBought: "Frequently Bought Together",
    cartAddedModalFrequentlyBoughtDesc: "Optimize your build with these recommended compatible parts:",
    cartAddedModalAddToCart: "Add to Cart",
    cartAddedModalAdded: "Added",
    cartAddedModalViewCart: "View Cart",
    cartAddedModalCheckout: "Proceed to Checkout",
    cartAddedModalContinue: "Continue Shopping",

    // Smart Pre-Checkout Optimizer
    smartCheckoutModalTitle: "Smart Order Optimization",
    smartCheckoutModalSubtitle: "We detected bundle savings and recommended parts before you checkout.",
    smartCheckoutComboBadge: "Combo Bundle Savings Detected!",
    smartCheckoutComboSwapBtn: "Swap Items for Combo & Save",
    smartCheckoutComboSwappedSuccess: "Items successfully upgraded to combo!",
    smartCheckoutCurrentParts: "Individual items in your cart:",
    smartCheckoutComboPrice: "Official Combo Price:",
    smartCheckoutYouSave: "You Save on this order:",
    smartCheckoutRelatedTitle: "Suggested Complementary Parts",
    smartCheckoutRelatedDesc: "Based on your cart items, our specialists recommend adding:",
    smartCheckoutContinueBtn: "Proceed to Payment",
    smartCheckoutSkipBtn: "Skip and proceed to payment",
    smartCheckoutBannerNotice: "💡 Optimization Available: You have parts qualifying for Combo",
    smartCheckoutBannerAction: "View Deal & Apply Discount",
    cartQuoteViaWhatsapp: "Quote Order via WhatsApp",
    whatsappConciergePrompt: "Looking for a custom US import or have technical fitment questions?",
    whatsappQuoteTitle: "Chat with a ZxZ Advisor",

    loadingCatalog: "Loading dynamic catalog...",
    loadingVehicleData: "Querying vehicle fitment data...",
    systemBoot: "INITIALIZING ZXZ MODS SYSTEMS...",
    enterSite: "ENTER STORE",
    skipIntro: "Skip Intro",
    scrollDown: "Scroll down",

    productsTitle: "SXS Parts & Components Catalog",
    productsSubtitle: "High-performance parts tested in Costa Rica with mechanical workshop warranty and professional installation support.",
    productsSearchPlaceholder: "Search parts by name, category, brand or SXS model...",
    productsAllCategories: "All Categories",
    productsAllBrands: "All Brands",
    productsAllVehicles: "All SXS Models",
    productsFilterCategory: "Category",
    productsFilterBrand: "Brand",
    productsFilterVehicleBrand: "Vehicle Brand",
    productsAllVehicleBrands: "All Vehicles",
    productsFilterModelCategory: "Brand Model Category",
    productsAllModelCategories: "All Categories",
    productsBrandCategoriesHeading: "Categories & Families",
    productsModelsInCategory: "Models",
    productsFilterDistributorBrand: "Distributor Brand",
    productsAllDistributorBrands: "All Brands",
    productsFilterInStock: "In Stock",
    productsFilterDiscounted: "On Sale",
    productsFilterCompatibility: "Fitment",
    productsFitMyGarage: "Compatible with My Garage",
    productsSortBy: "Sort by",
    productsSortRelevant: "Relevance",
    productsSortPriceAsc: "Price: Low to High",
    productsSortPriceDesc: "Price: High to Low",
    productsSortRating: "Top Rated",
    productsPricePiece: "Total selling price:",
    productsPriceIncludesIva: "VAT included",
    productsPriceWithIvaFull: "13% VAT included",
    checkoutPricesIncludeIvaNotice: "All prices include 13% VAT in compliance with Costa Rican tax law.",
    devProductIvaTitle: "VAT (13% - Value Added Tax)",
    devProductIvaHelp: "When creating or editing a product, 13% VAT is automatically calculated on the subtotal and added to determine the True Total Price (T_price). Products and checkout reflect that VAT is already included.",
    productsInstallationFree: "Free installation on this product",
    productsInstallationAddon: "Installation available at ZxZ workshop",
    productsCurrencyCheckoutNote: "USD price available at checkout",
    productsRequirementsNotice: "Recommended Requirement",
    productsUniversalFit: "Compatible with all SXS / Universal",
    productsFitsSxs: "Compatible with:",
    productsAddToCart: "Add to Cart",
    productsQuoteWhatsapp: "Quote via WhatsApp",
    productsNoResults: "No matching products found",
    productsNoResultsDesc: "Try adjusting your search terms or clearing your selected filters.",
    productsClearFilters: "Clear Filters",
    productsCount: "products available",
    productAudioSample: "Exhaust Sound Sample",
    productVideoSample: "Product Demonstration Video",
    productListenAudio: "Exhaust sound at idle (Idle Sound)",
    productAudioIdle: "Exhaust Idle Sound",
    productAudioRev: "Exhaust Revving Sound",
    productAudioSelectTrack: "Select Sound Sample:",
    productAudioErrorNotice: "Could not play this audio clip.",
    productNoReviews: "No reviews yet",
    productFitCheckTitle: "Vehicle Fitment Check",
    productFitCheckCompatible: "Verified fit for your",
    productFitCheckIncompatible: "Not compatible with your",
    productFitCheckDirectFit: "This part fits directly on your vehicle without modifications.",
    productFitCheckPlatformNote: "This accessory is engineered specifically for platforms",
    productFitCheckNoVehicle: "Not sure if this fits your vehicle? Set your model in 'My Garage' to verify exact fitment before ordering.",
    productFitCheckConfigureBtn: "Set Vehicle in Garage",
    productFitCheckChangeBtn: "Change",
    productRequirementsShelfTitle: "Components Required for Operation",
    productRequirementsShelfSubtitle: "Necessary parts recommended for proper vehicle operation.",
    productRelatedShelfTitle: "Related Products",
    productRelatedShelfSubtitle: "Recommended upgrades, ECU tunes, and compatible components.",
    productModelYearCompatTitle: "Model & Year Compatibility",
    productModelYearCompatSubtitle: "Official list of verified makes, models, and year ranges for this component.",
    productMake: "Make",
    productModel: "Model",
    productYears: "Compatible Years",
    productTrim: "Trim / Version",
    productFitmentType: "Fitment Type",
    productFitmentNotes: "Fitment Notes",
    productVehicleMatches: "Confirmed fit for your Garage vehicle",
    productVehicleAutoSelected: "Registered vehicle auto-selected",
    productUniversalModelYear: "Universal: Engineered and verified for all SXS / UTV / ATV makes, models, and years.",
    productViewYearFitment: "View compatible models & years",

    // Supplier Availability Projection
    supplierStockInStock: "In Stock",
    supplierStockPreOrder: "Pre-Order",
    supplierStockLowStock: "Low Stock",
    supplierStockOutOfStock: "Temporarily Out of Stock",
    supplierStockUnavailable: "Unavailable",
    supplierVerifiedBadge: "Verified with official manufacturer",
    supplierLeadTimeText: "Estimated delivery to Costa Rica: {min}-{max} business days",
    supplierPreOrderNotice: "Pre-order item. Your order will be reserved with priority upon release.",
    supplierReserveQuotationBtn: "Request Reservation Quote",
    supplierReserveQuotationNotice: "This product is currently out of stock at factory. You can submit a reservation quote with no obligation so our staff can schedule delivery as soon as restocked.",

    // Customer Verified Reviews System (English)
    reviewsSectionTitle: "Verified Customer Reviews",
    reviewsSectionSubtitle: "Real reviews and ratings from verified buyers who completed their purchase and installation.",
    reviewsVerifiedBuyerBadge: "Verified Buyer",
    reviewsVerifiedBuyerNotice: "You have completed purchase of this item. Share your thoughts with the community!",
    reviewsCompletedOrderOnlyNotice: "Only customers with a completed and delivered order can review this product or combo.",
    reviewsWriteReviewBtn: "Write a Review",
    reviewsEditReviewBtn: "Edit My Review",
    reviewsFormTitle: "Rate Product / Combo",
    reviewsFormEditTitle: "Update Your Rating",
    reviewsRatingLabel: "Overall Rating",
    reviewsTitleLabel: "Review Title (optional)",
    reviewsTitlePlaceholder: "E.g.: Incredible engine response and seamless fitment",
    reviewsCommentLabel: "Your Feedback or Review",
    reviewsCommentPlaceholder: "Tell us about performance, durability, build quality, and installation experience...",
    reviewsSubmitBtn: "Submit Verified Review",
    reviewsSaveEditBtn: "Save Changes",
    reviewsCancelBtn: "Cancel",
    reviewsSubmitting: "Submitting review...",
    reviewsSuccessToast: "Review published successfully! Thank you for your feedback.",
    reviewsErrorToast: "An error occurred while saving your review. Please try again.",
    reviewsEmptyList: "This item does not have published reviews yet. Once your order is completed and delivered, you can leave your review here.",
    reviewsLoginPrompt: "Log in with your account to verify if you have completed orders for this item.",
    reviewsRatingOutOfFive: "out of 5 stars",
    reviewsAverageRating: "Average Rating",
    reviewsBasedOn: "based on",
    reviewsFilterAll: "All ratings",
    reviewsMyReviewBadge: "Your Review",
    orderLeaveReviewBtn: "Review Item",
    orderEditReviewBtn: "Edit Review",
    supplierCartPreOrderChip: "Pre-Order",
    supplierCartInStockChip: "In Stock ({min}-{max} d)",
    supplierCartOutOfStockChip: "Out of Stock",
    supplierCartOutOfStockWarning: "This product is temporarily out of stock. We recommend requesting a reservation quote to secure your priority spot.",
    supplierLastCheckedLabel: "Verified",
    supplierCheckingLive: "Checking live availability...",

    // Backdoor / Stealth Dev-Console
    devConsoleTitle: "ZxZ Developer Console",
    devConsoleSubtitle: "Operations Terminal, Catalog, Discounts & Orders",
    devRoleMaster: "Master (Full Access)",
    devRoleStaff: "Technical Staff (Operations)",
    devCostShipping: "Shipping Cost",
    devCostInstallation: "Installation Cost",
    devCostPickup: "Store Pickup Cost",
    devCostParts: "Parts Subtotal",
    devOrderProgression: "Order Progression",
    devStatusPending: "Pending",
    devStatusPartsOrdered: "Parts Ordered",
    devStatusInTransit: "In Transit to CR",
    devStatusReadyForInstall: "Ready for Installation",
    devStatusInProgress: "In Shop / Installing",
    devStatusCompleted: "Completed & Delivered",
    devStatusCancelled: "Cancelled",
    devDiscountAdd: "Apply Discount",
    devDiscountPercentage: "Percentage Discount (%)",
    devDiscountFixed: "Fixed Discount (₡)",
    devDiscountReason: "Discount Reason",
    devBasePriceLocked: "Base Price Locked (Master Exclusive)",
    devInstallationCostEditable: "Installation Cost Editable by Staff",
    devAuditHistory: "Audit History (6 Months)",
    devAuditActor: "User",
    devAuditAction: "Recorded Action",
    devAuditTimestamp: "Date & Time",
    devAuditOldValue: "Previous Value",
    devAuditNewValue: "New Value",
    devAuthEmail: "Access Email",
    devAuthPasskey: "Passkey / Security Key",
    devAuthLoginBtn: "Authenticate Terminal",
    devAuthAuthenticating: "Verifying Credentials...",
    devAuthLogoutBtn: "Logout Terminal",
    devAuthTerminalLocked: "Terminal Locked Due to Failed Attempts",
    devAuthSessionActive: "Cryptographic Session Active",
    devAuthSecuredConnection: "Encrypted Secure Connection",
    devOrdersTitle: "Order Management & Parts Progression",
    devCreateOrderTitle: "Create Custom Order for Customer",
    devCatalogTitle: "Catalog Management (Products & Combos)",
    devAuditTitle: "Audit Changelog (6-Month History)",
    devStaffTitle: "Access Control & Staff Accounts",
    devSearchPlaceholder: "Search by order #, customer or phone...",
    devFilterAll: "All Statuses",
    devNoOrders: "No orders found matching this criteria.",
    devSaveSuccess: "Changes successfully committed to database.",
    devSaveError: "An error occurred while saving changes.",
    devCreateProductBtn: "+ New Product",
    devCreateComboBtn: "+ New Combo",
    devCreateStaffBtn: "+ New Staff Profile",
    devUploadImage: "Upload Image",
    devUploading: "Uploading...",
    devSelectCustomer: "Link to Registered User Account",
    devGuestCustomer: "Walk-In Customer / Guest",
    devDeliveryType: "Delivery / Service Type",
    devHomeInstallation: "At-Home Installation",
    devStorePickup: "Store Pickup (Santa Ana Workshop)",
    devShippingCR: "Courier Shipping (Costa Rica)",
    devDiscountLimitAlert: "Technical staff is limited to a maximum 15% discount.",
    orderStatusPaymentConfirmation: "Payment Confirmation",
    orderDeleteBtn: "Delete",
    orderDeleteQuoteConfirmTitle: "Delete Quotation",
    orderDeleteQuoteConfirmPrompt: "Are you sure you want to delete this quotation? This action is permanent.",
    orderDeleteMasterPasswordRequired: "Deleting an order in Payment Confirmation or later requires authorization with Master password.",
    orderMasterPasswordLabel: "Master Password Required",
    orderMasterPasswordPlaceholder: "Enter Master user password...",
    orderDeleteSuccessMsg: "Order deleted successfully.",
    orderEditQuoteTitle: "Edit Quotation (Initial State)",
    orderManageTitle: "Order Management, Messages & Transport",
    orderHasNotesBadge: "Note / Message",
    orderImportantNotesLabel: "Messages & Critical Information",
    orderAddNoteBtn: "Add Note / Message",
    orderSelectTransportService: "Mobility & Transport Service",
    orderTransportStorePickup: "Workshop Pickup (Pozos, Santa Ana)",
    orderTransportHomeService: "At-Home Installation / Service",
    orderTransportUtvPickup: "UTV Flatbed Pickup to Workshop",
    orderTransportShipping: "Courier Shipping",
    devYearFromLabel: "Year From",
    devYearToLabel: "Year To",
    devYearRangeTitle: "Compatible Year Range",
    devUploadVideoBtn: "Upload Video",
    devUploadAudioBtn: "Upload HD Audio",
    devMediaUploadSection: "Direct Media Upload (Images, Videos & HD Audio)",
    comboInstallationIncluded: "Included",
    comboInstallationBadge: "Installation Included",
    productEliminateBtn: "Eliminate Product",
    productEliminateConfirmTitle: "Permanently Eliminate Product",
    productEliminateConfirmPrompt: "This action will permanently delete the product from the database and catalog. Master confirmation required.",
    productEliminateSuccess: "Product permanently eliminated from catalog.",
    productArchiveBtn: "Archive",
    productUnarchiveBtn: "Unarchive",
    productArchiveConfirmPrompt: "Do you want to archive this product? It will no longer be visible to customers in the store.",
    productUnarchiveConfirmPrompt: "Do you want to unarchive this product and reactivate it in the public store?",
    productFilterAll: "All",
    productFilterActive: "Active",
    productFilterArchived: "Archived",
    productFindArchivedBtn: "View Archived",
    comboEliminateBtn: "Eliminate Combo",
    comboEliminateConfirmTitle: "Permanently Eliminate Combo",
    comboEliminateConfirmPrompt: "This action will irreversibly destroy the combo from the catalog. Master password confirmation is required.",
    comboEliminateSuccess: "Combo permanently eliminated from catalog.",
    comboArchiveBtn: "Archive",
    comboUnarchiveBtn: "Unarchive",
    comboArchiveConfirmPrompt: "Are you sure you want to archive this combo? It will no longer be visible to customers in the store.",
    comboUnarchiveConfirmPrompt: "Do you want to restore this combo so it is visible in the public store again?",
    comboFilterAll: "All",
    comboFilterActive: "Active",
    comboFilterArchived: "Archived",
    comboFindArchivedBtn: "View Archived",
    orderPaymentProofTitle: "Payment Proof",
    orderPaymentProofBadge: "Proof Attached",
    orderNoPaymentProofBadge: "No Proof Attached",
    orderViewPaymentProofBtn: "View Receipt",
    orderUploadPaymentProofBtn: "Upload Receipt",
    orderPaymentProofModalTitle: "Client Payment Proof",
    orderPaymentProofModalSubtitle: "Wire transfer and funds verification for order confirmation",
    orderPaymentProofEmpty: "The client has not uploaded a digital receipt for this order yet.",
    orderPaymentProofVerified: "Receipt uploaded for funds validation",
    orderPaymentProofOpenFull: "Fullscreen",
    orderPaymentProofNewTab: "Open in New Tab",
    orderPaymentProofCurrencyLabel: "Recorded Payment Currency",
    orderPaymentProofAttachStaffBtn: "Attach / Update Receipt (Staff)",
    orderServicePaymentProofTitle: "Service / Transport Payment Proof",
    orderServicePaymentProofSubtitle: "Receipt for transport cost, delivery, or service scheduling fee",
    orderInstallationPaymentProofTitle: "Installation Payment Proof",
    orderInstallationPaymentProofSubtitle: "Receipt for installation labor fee",
    orderPickupClientNotice: "In Pick-up service, this proof can be attached by the client or managed by staff.",
    orderStaffManagedNotice: "Attached and verified by workshop staff.",
    orderAttachServiceProofBtn: "Attach Service Proof",
    orderAttachInstallationProofBtn: "Attach Installation Proof",
    orderInspectProofBtn: "Inspect Proof",
    orderDiscountTitle: "Special Quotation Discount",

    orderDiscountTypePercent: "Percentage (%)",
    orderDiscountTypeAmount: "Direct Amount (₡)",
    orderDiscountMasterPasswordReq: "Applying discounts to the order requires Master password authorization.",
    orderConfigureTransportBtn: "Configure Transport Service",
    orderTransportConfigModalTitle: "Transport & Logistics Service Configuration",
    orderStatusNeedToGetOrder: "Need to Get Order (*un)",
    orderStatusShippingInUs: "Shipping in US",
    orderStatusShippingToCr: "Shipping to Costa Rica",
    orderStatusInCostaRica: "In Costa Rica (*un)",
    orderStatusInWarehouseCheck: "In Warehouse to Check",
    orderStatusReadyToPickUp: "Ready to Pick Up",
    orderStatusProgramService: "Program Service",
    orderStatusWaitingOnDelivery: "Waiting on Delivery",
    orderStatusPickupDateSet: "Pick-up Date Set",
    orderStatusInstalling: "Installing",
    orderStatusReadyToSetReturnDate: "Ready to Set Return Date",
    orderStatusHomeInstallSet: "Home Install Set",
    orderStatusReadyForPickup: "Ready for Pick Up",
    orderStatusCompleted: "Completed & Delivered",
    orderStatusPaymentRejected: "Payment Rejected",
    orderRejectedPaymentCorrectedBadge: "Corrected Payment • Review Payment",
    orderRejectedCorrectedStaffBannerTitle: "Corrected Payment: Receipt Ready for Review",
    orderRejectedCorrectedStaffBannerDesc: "The customer has uploaded a new payment proof. Please review the receipt and press 'Advance' to resume workflow.",
    orderRejectedCorrectedCustomerTitle: "Receipt Under Review",
    orderRejectedCorrectedCustomerNotice: "We received your updated payment receipt. Our workshop team is reviewing it shortly to proceed with your order.",
    emailSubjectOrderPaymentConfirmed: "Payment Confirmed - Order",
    emailSubjectServicePaymentConfirmed: "Service Payment Confirmed - Order",
    emailSubjectInstallationPaymentConfirmed: "Installation Payment Confirmed - Order",
    emailSubjectPaymentRejected: "Action Required: Payment Receipt Rejected - Order",
    emailSubjectProgramService: "Ready to Schedule Service - Order",
    emailSubjectReadyForPickup: "Your Order / Vehicle is Ready for Pick-up! - Order",
    emailSubjectPickupDateSet: "Pick-up Date Confirmed - Order",
    emailSubjectOrderCompleted: "Order Completed & Delivered! - Order",
    emailSubjectInstallationPayment: "Installation Payment Pending - Order",
    emailGoogleReviewPrompt: "How was your experience with ZxZ Mods? Review us on Google Maps",
    emailGoogleReviewButton: "Review us on Google Maps ⭐⭐⭐⭐⭐",
    emailViewOrderButton: "View Order Status",
    emailScheduleServiceButton: "Schedule Service Appointment",
    emailPayInstallationButton: "Pay Installation Online",
    emailUploadNewReceiptButton: "Correct and Re-upload Receipt",
    orderRejectPaymentBtn: "Reject Payment",
    orderRejectServicePaymentBtn: "Reject Service Payment",
    orderRejectInstallPaymentBtn: "Reject Installation Payment",
    orderRejectServiceModalTitle: "Reject Service Payment Proof",
    orderRejectInstallModalTitle: "Reject Installation Payment Proof",
    orderAdvanceStageBtn: "Advance to Next Stage",
    orderRejectModalTitle: "Reject Payment Proof",
    orderRejectReasonPrompt: "Rejection reason (required to notify the client):",
    orderRejectReasonPlaceholder: "E.g., Receipt unreadable, amount does not match invoice, reference number not found...",
    orderRejectConfirmBtn: "Confirm Rejection",
    orderRejectedCustomerAlert: "Payment Proof Rejected",
    orderRejectedCustomerAdvice: "ZxZ Mods reviewed your receipt but could not validate it. Please check the reason noted by staff and re-upload a valid payment proof to proceed.",
    orderReuploadProofBtn: "Re-upload Payment Proof",
    orderConfigureReturnDelivery: "Configure Vehicle Return Delivery (50% Rate)",
    orderHalfRateDeliveryBadge: "50% Return Rate",
    orderHalfRateDeliveryDesc: "Vehicle return delivery after workshop installation at half transport rate (return trip only)",
    orderConfirmStatusTitle: "Confirm Status Change",
    orderConfirmStatusPrompt: "Are you sure you want to advance order",
    orderConfirmBtn: "Confirm & Update",
    orderCancelBtn: "Cancel",
    devProductEditMode: "Product Edit Mode (Store View)",
    devProductEditModeDesc: "Editing this product using the official public store visual layout",
    devBackToCatalog: "Back to Catalog",
    devSaveChanges: "Save Changes",
    devSaving: "Saving...",
    devComboEditTitle: "Edit Combo",
    devComboCreateTitle: "New Combo",
    devComboEditScreenTitle: "Edit Accessory Combo",
    devComboCreateScreenTitle: "Create New Accessory Combo",
    productParametersTitle: "Configuration & Options",
    productParametersDesc: "Customize this product with your preferred specifications",
    productParameterOptionSelect: "Select option",
    productParameterPriceModifier: "Price modifier",
    productParameterIncluded: "Included",
    devParametersTitle: "Configurable Parameters & Variants",
    devParametersDesc: "Configure customizable options like colors, finishes, materials or stages that dynamically adjust price in real time.",
    devAddParameterBtn: "+ Add Parameter",
    devRemoveParameterBtn: "Delete Parameter",
    devParameterNameEsLabel: "Parameter Name (Spanish)",
    devParameterNameEnLabel: "Parameter Name (English)",
    devParameterOptionsTitle: "Parameter Options",
    devAddOptionBtn: "+ Add Option",
    devRemoveOptionBtn: "Delete Option",
    devOptionLabelEs: "Option Label (Spanish)",
    devOptionLabelEn: "Option Label (English)",
    devOptionPriceDelta: "Price Delta (+/- ₡ CRC)",
    devOptionPriceDeltaHelp: "Enter adjustment relative to base price (e.g. 0 for same price, 5000 for +₡5,000, or negative).",
    devNoParametersNotice: "No parameters configured yet. This item will have a single fixed price without selectable variations.",
    devAddColorPresetBtn: "+ Color Preset (Orange, Black, Blue)",
    devOptionColorLabel: "Visual Color",
    devOptionImageLabel: "Variant Photo (Optional)",
    devOptionImageUpload: "Upload Photo",
    devOptionNoColor: "No Color",
    devOptionSupplierUrlLabel: "Supplier URL for this option (supplierUrl):",
    devAddProductLinkingPresetBtn: "+ Product Linking (Amazon)",
    devParameterTypeLabel: "Parameter Type:",
    devParamTypeButton: "Standard Buttons",
    devParamTypeColor: "Color Swatches",
    devParamTypeProductLinking: "Product Linking (Amazon Style)",
    devSelectLinkedProduct: "Select product to link...",
    devLinkedProductBadge: "Linked Product",
    devLinkedProductDesc: "Swaps images, pricing, and specs seamlessly on this screen.",
    productLinkedUpgradesTitle: "Product Edition / Version:",
    devComboIncludedProducts: "Products Included in Combo",
    devComboSearchProductPlaceholder: "Search catalog product to add to combo...",
    devComboAddProduct: "Add to Combo",
    devComboEditProductLink: "Edit Product",
    devComboNoProductsSelected: "No products selected yet. Search products above to link them to this combo.",
    devComboUniqueProductTitle: "Unique Combo Product / Service",
    devComboUniqueProductDesc: "Create an exclusive product or service for this combo (e.g., full suspension adjustment according to ride style, weight, and accessories). Not all combos require this unique product.",
    devComboUniqueProductEnableToggle: "Include Unique Product / Service in this Combo",
    devComboUniqueProductTemplates: "Quick Templates:",
    devComboUniqueProductTemplateSuspension: "Suspension Tuning (Style, Weight, Accessories)",
    devComboUniqueProductTemplateECU: "ECU Remap / Tuning",
    devComboUniqueProductTemplateCustom: "Blank Custom",
    devComboUniqueProductNameEs: "Product/Service Name (Spanish)",
    devComboUniqueProductNameEn: "Product/Service Name (English)",
    devComboUniqueProductBadgeEs: "Badge (Spanish)",
    devComboUniqueProductBadgeEn: "Badge (English)",
    devComboUniqueProductDescEs: "Detailed Description (Spanish)",
    devComboUniqueProductDescEn: "Detailed Description (English)",
    devComboUniqueProductPrice: "Included Value / Price in Combo (₡)",
    devComboUniqueProductImage: "Unique Product/Service Image",
    devComboUniqueProductUploadImage: "Upload Image",
    devComboUniqueProductFieldsTitle: "Customization Fields Required from Buyer",
    devComboUniqueProductFieldsSubtitle: "Define the specifications the customer must provide when buying this combo (e.g. Rider weight, Ride style, Installed accessories).",
    devComboUniqueProductAddField: "Add Field",
    devComboUniqueProductFieldName: "Field Name",
    devComboUniqueProductFieldType: "Field Type",
    devComboUniqueProductFieldTypeText: "Free Text",
    devComboUniqueProductFieldTypeNumber: "Number",
    devComboUniqueProductFieldTypeSelect: "Options (Dropdown)",
    devComboUniqueProductFieldOptionsPrompt: "Comma-separated options (e.g. Dunes, Trail, Rocks)",
    devComboUniqueProductFieldRequired: "Required",
    devComboUniqueProductQuickCreateProduct: "Quick Create Product in Catalog",
    devComboUniqueProductQuickCreateModalTitle: "Create & Link New Product to Catalog",
    devComboUniqueProductQuickCreateSuccess: "Product created successfully and linked to combo.",
    comboUniqueProductBadgeDefault: "EXCLUSIVE PRODUCT / SERVICE",
    comboUniqueProductCustomizationTitle: "Customization Required for this Combo",
    comboUniqueProductCustomizationSubtitle: "Please specify the following details so our technicians prepare and calibrate the package specifically for you and your machine.",
    comboUniqueProductRequiredMissing: "Please complete the following required combo customization fields before proceeding:",
    devComboAvailabilityCol: "Availability",
    devComboAvailabilityLiveTitle: "Live Dynamic Combo Availability",
    devComboAvailabilityNotice: "This combo's availability is automatically calculated in real-time based on the stock of its listed products.",
    devComboStockInStock: "In Stock",
    devComboStockPreOrder: "Pre-Order",
    devComboStockLowStock: "Low Stock",
    devComboStockOutOfStock: "Out of Stock at Supplier",
    devComboStockUnavailable: "Unavailable",
    devComboMissingComponentsWarning: "One or more listed components are out of stock or unavailable.",
    devComboAllComponentsReady: "All listed components are ready for dispatch.",
    comboOutOfStockAlertTitle: "Bundle Temporarily Unavailable",
    comboOutOfStockAlertDesc: "One or more components included in this package are temporarily out of stock at the supplier. You can request a custom quote or consult alternatives with our advisors.",
    comboComponentInStock: "In stock",
    comboComponentPreOrder: "Pre-order",
    comboComponentOutOfStock: "Out of stock",
    comboComponentArchived: "Archived",
    comboQuoteBecauseOutOfStock: "Inquire Parts via WhatsApp",
    devItemsIncluded: "Items Included in Kit",
    devOriginalPrice: "Regular / Original Price (CRC)",
    devDiscountPercent: "Discount (%)",
    devBadgeLabel: "Badge",
    devCombosListTitle: "Combos & Accessory Packages",
    devProductsListTitle: "Catalog Products",
    devStockStatus: "Stock Status",
    devBaseHardwarePrice: "Base Hardware Price (CRC)",
    devLaborInstallCost: "Labor / Installation Cost (CRC)",
    devInstallLabourCostLabel: "Installation Labour Cost (CRC)",
    devInstallExtraPartsLabel: "Installation Extra Parts & Materials",
    devInstallExtraPartsAddBtn: "+ Add Extra Part / Material",
    devInstallExtraPartsNamePlaceholder: "Part name (e.g. 40A Relay, Harness, Mount)",
    devInstallExtraPartsPricePlaceholder: "Price (CRC)",
    devInstallExtraPartsEmpty: "No extra parts or materials registered for this installation.",
    devInstallExtraPartsTotal: "Extra Parts Subtotal",
    devInstallProfitLabel: "Installation Profit (CRC)",
    devInstallTotalCostLabel: "Total Installation Cost (I_price)",
    devInstallBreakdownHelp: "Sums labour cost, extra parts/materials and profit to compute total installation cost and accurately track expenses.",
    devComboAddProductInstallCostsBtn: "Add up installation costs from included products",
    devComboProductsInstallSummary: "Installation sum from selected products",
    devStaffInstallEditable: "Editable by technical staff",
    devMasterPriceOnly: "Only Master profile can edit base price",
    devFreeInstallationCheckbox: "Free Installation (Included in price)",
    devFreeInstallationHelp: "When enabled, the store displays the 'Free Installation' badge and installation labor is counted as ₡0 in store.",
    devFreeInstallationBadge: "Installation Included",
    devCompLabel: "Compatibility Tags (comp)",
    devCategoryLabel: "Categories (category)",
    devBrandLabel: "Brand (brand)",
    devAutoGenerateSkuBtn: "✨ Auto-Generate SKU",
    devSkuPatternHelp: "Pattern: [Brand SKU] - [Vehicle(s) SKU] - [Brand Sequence (e.g. 04)]",
    devPriceBreakdownTitle: "Full Price Breakdown (price)",
    devPriceProcessingUSD: "P_price_D (Processing price in USD)",
    devPriceProcessingCRC: "P_price (Processing price in CRC)",
    devPriceShippingCRC: "S_price (Shipping & import cost in CRC)",
    devPriceLaborCRC: "I_price (Installation labor cost in CRC)",
    devPriceProfitCRC: "profit (Profit margin in CRC)",
    devPriceTotalCRC: "T_price (Total selling price in CRC)",
    devPriceTotalUSD: "T_price_D (USD Reference / Note)",
    devPriceDollarNotice: "The price in dollars will only be shown in the checkout where the customer can choose which currency to pay in.",
    devAutoCalculatePrice: "Auto-Calculate Total",
    devImagesListLabel: "Image Gallery (imgs)",
    devVideosListLabel: "Video Samples (vids)",
    devAudiosListLabel: "HD Audio Samples (audios)",
    devProductTitleLabel: "Product Title (p_title)",
    devRequirementsLabel: "Technical Requirements (requirements)",
    devReviewsLabel: "Reviews / Ratings (reviews)",
    devInHomeInstallLabel: "inHome_install (Home Installation available)",
    devYearCompatLabel: "Model & Year Compatibility Matrix (year_compatability)",
    devAudioPreview: "HD Audio Preview",
    devSpecsAndDesc: "Specs & Description",
    devCompatibilityList: "SXS Vehicles & Year Compatibility",
    devHomeInstallEligible: "Eligible for At-Home Installation",
    devCompVehiclesLabel: "Compatible Vehicles (comp)",
    devAddVehicleSelector: "Add Compatible Vehicle",
    devSelectVehiclePrompt: "-- Select Registered Vehicle --",
    devRemoveVehicle: "Remove vehicle",
    devUniversalFitment: "Universal (All models)",
    devCategorySelectorLabel: "Product Category",
    devSelectCategoryPrompt: "-- Select Category --",
    devAddCategoryBtn: "Add Category",
    devNewCategoryBtn: "+ New Category",
    devComboCategoryLabel: "Combo Category",
    devAddCategoryModalTitle: "Create New Category",
    devAddCategoryModalDesc: "Add a new category to the catalog. First letter will always be capitalized.",
    devCategoryNameEsLabel: "Category Name (Spanish)",
    devCategoryNameEnLabel: "Category Name (English - Optional)",
    devCategoryCreatedSuccess: "Category created successfully!",
    devCategoryCreateError: "Error creating category",
    devCategoryCapsNotice: "First letter must always be capitalized",

    // Pick-up, Delivery & Home Installation
    servicesTitle: "Mobility, Delivery & Installation Services",
    servicesSubtitle: "Vehicle pick-up, parts delivery, and on-site technical installation directly from our shop in Pozos, Santa Ana.",
    serviceTabPickup: "Vehicle Pick-up",
    serviceTabDelivery: "Parts Delivery",
    serviceTabInstallation: "Home Installation",
    serviceTabShopInstallation: "In-Shop Installation Only",
    servicePickupDesc: "Specialized vehicle transport. The price covers both pick-up and subsequent return delivery; no additional transport will be charged upon delivery.",
    servicePickupRoundTripNotice: "The price covers both vehicle pick-up and return delivery. No additional transport fee will be charged upon delivery.",
    servicePickupRoundTripBadge: "Includes Pick-up & Return Delivery (Round Trip)",
    // Pick-up vehicle compatibility specifications (LE-01)
    pickupCompatTitle: "Vehicle Compatibility & Transport Specifications (Trailer)",
    pickupCompatSubtitle: "Verify that your vehicle complies with physical dimensions and mechanical conditions for safe flatbed transport by ZxZ Mods.",
    pickupCompatCategory: "Compatible Vehicle Categories",
    pickupCompatCategoryVal: "SxS, UTV, and ATV (CFMOTO, Can-Am, Polaris, Yamaha, Honda, Segway, and similar)",
    pickupCompatMaxWidth: "Maximum Track Width",
    pickupCompatMaxWidthVal: "Up to 74 inches (1.88 m) overall width",
    pickupCompatMaxLength: "Maximum Chassis Length",
    pickupCompatMaxLengthVal: "Up to 4.20 m (165\") total length",
    pickupCompatMaxWeight: "Maximum Supported Weight",
    pickupCompatMaxWeightVal: "Up to 1,600 kg (3,520 lbs) vehicle curb weight",
    pickupCompatMaxHeight: "Maximum Roll-Cage / Roof Height",
    pickupCompatMaxHeightVal: "Up to 2.10 m (83\") clearance height",
    pickupCompatCondition: "Required Mechanical Condition",
    pickupCompatConditionVal: "Wheels and steering operable, neutral gear or winchable (free brakes for safe trailer loading)",
    pickupCompatNote: "If your vehicle features extreme modifications (e.g. lift kit >6\", tires >35\", or width >74\"), please message us via WhatsApp in advance to coordinate specialized transport.",

    // Delivery Window & Estimates (LE-02)
    deliveryWindowBanner: "Delivery Window: Minimum 7 to Maximum 21 Business Days",
    deliveryWindowDisclaimer: "Stated delivery timeframes are professional estimates and do NOT constitute a guaranteed fixed delivery date due to international air freight and customs clearance.",

    // Suggested Combos & Products (LE-03)
    productSuggestedCombosTitle: "Suggested Combos with this Product",
    productSuggestedCombosSubtitle: "Complete verified bundles that feature this part or complementary upgrades with special savings.",
    productSuggestedProductsTitle: "Recommended & Related Products",
    productSuggestedProductsSubtitle: "Upgrades, parts, and hardware from the same category or platform for your vehicle.",
    productViewComboBtn: "View Full Combo",
    productViewProductBtn: "View Product",
    productSuggestedEmpty: "No other related items found at this time.",

    // Products Analysis (FA-03)
    productsAnalysisTitle: "Products Performance Analysis",
    productsAnalysisSubtitle: "Consolidated sales metrics, top selling brands, and highest margin products for staff members.",
    productsAnalysisMostSoldBrand: "Most Sold Brand",
    productsAnalysisMostSoldItem: "Most Sold Product",
    productsAnalysisMostSoldCombo: "Most Sold Combo",
    productsAnalysisHighestMargin: "Highest Profit Margin",

    serviceDeliveryDesc: "Fast, secure transport of parts, upgrades, and combos delivered straight to your door or garage.",
    serviceInstallationDesc: "Certified technicians arriving with mobile tools to install parts right at your home or property.",
    serviceShopInstallationDesc: "Bring your SxS directly to our shop. Zero transport cost. Schedule your date and time for our team to install it.",
    serviceShopInstallationBadge: "No Transport Fee (₡0)",
    serviceShopDirectNotice: "You will bring your vehicle directly to our shop at Calle 34, Pozos, Santa Ana. No transport fee applies.",
    serviceLocationPrecisionError: "Please enter a more specific location (at least 3 characters)",
    calendarTitle: "Availability Calendar",
    calendarSelectDate: "Select an available date",
    calendarSelectedDate: "Selected date",
    calendarClosedSunday: "Closed on Sundays (WhatsApp Support)",
    calendarPrevMonth: "Previous month",
    calendarNextMonth: "Next month",
    timeSlotMorning: "Morning (8:00 AM - 12:00 PM)",
    timeSlotAfternoon: "Afternoon (1:00 PM - 5:00 PM)",
    garageOriginLabel: "ZxZ Mods Garage (Origin)",
    garageOriginAddress: "Calle 34, Pozos, Santa Ana, Costa Rica",
    destinationInputLabel: "Destination Address or Location",
    destinationInputPlaceholder: "Enter canton, district, or landmark (e.g. Escazu, Lindora, Belen, Guacima...)",
    quickLocationsLabel: "Quick destinations:",
    useCurrentLocationBtn: "Use my current location",
    calculatingRoute: "Calculating route and distance...",
    distanceLabel: "Estimated Distance",
    timeLabel: "Approx. Travel Time",
    ratePerKmLabel: "Rate per km",
    baseRateLabel: "Base starting fee",
    totalCostLabel: "Estimated Total Cost",
    openGoogleMapsBtn: "Open in Google Maps",
    openWazeBtn: "Navigate with Waze",
    requestServiceWhatsAppBtn: "Request Service on WhatsApp",
    backdoorLogisticsTab: "Km Rates",
    backdoorLogisticsTitle: "Kilometer Rates Configuration",
    backdoorLogisticsSubtitle: "Dynamic pricing variables per km for Pick-up, Delivery, and Home Installation from Calle 34, Pozos, Santa Ana.",
    backdoorPickupRate: "Pick-up Rate per Km (₡)",
    backdoorDeliveryRate: "Delivery Rate per Km (₡)",
    backdoorInstallationRate: "Home Installation Rate per Km (₡)",
    backdoorPickupBase: "Pick-up Base Fee (₡)",
    backdoorDeliveryBase: "Delivery Base Fee (₡)",
    backdoorInstallationBase: "Installation Base Fee (₡)",
    backdoorGarageAddress: "Garage / Workshop Address",
    backdoorRatesSavedSuccess: "Rates successfully updated in database",
    backdoorTestCalculatorTitle: "Real-Time Rate Simulator",
    serviceOrdersTitle: "Orders Ready to Schedule",
    serviceOrdersSubtitle: "Select an active order to schedule the service. You can calculate prices and distances freely.",
    serviceOrdersNoneFound: "No ready orders found in your account. You can freely calculate prices and distances below.",
    serviceOrdersLoginPrompt: "Sign in or enter your order # to schedule:",
    serviceOrdersSearchPlaceholder: "e.g. ZXZ-123456",
    serviceOrdersSearchBtn: "Search",
    serviceOrdersSelectedOrder: "Selected order",
    serviceOrdersRequiredNotice: "An active order is required to schedule the service. You can freely check prices and distances.",
    serviceDateTitle: "Service Date & Time",
    serviceDateLabel: "Execution Date",
    serviceTimeLabel: "Time slot",
    servicePresenceNotice: "A designated person must be present for the service reception and final handover.",
    serviceScheduleBtn: "Schedule Service",
    serviceScheduleRequiresOrder: "Select an order above to schedule the service",
    serviceScheduleRequiresLocation: "Pin your location on the map",
    serviceScheduleRequiresDate: "Select an execution date",
    serviceScheduleSuccess: "Service scheduled successfully!",
    clickMapToSetLocation: "Click on the map to set your location",
    serviceAvailabilityTitle: "Schedule Availability",
    serviceOperatingHours: "Dispatch operating hours: 8:00 AM to 8:00 PM",
    serviceSlotBlocked: "Blocked by transit / dispatch",
    serviceSlotAvailable: "Available",
    serviceSelectedTime: "Customer arrival time",
    serviceTravelBufferExplanation: "The system automatically blocks round-trip travel time plus 30 minutes for package prep and handover to prevent delays.",
    serviceHomeInstallFullDayNote: "Home installation reserves the entire working day (8:00 AM - 8:00 PM) for our technical team.",
    serviceCostResumeTitle: "Cost & Logistics Summary",
    serviceTripSummaryHeading: "Transit & Timing Breakdown",
    serviceRoundTripTravel: "Round-trip travel",
    serviceBufferPrep: "Package prep & handover buffer",
    servicePayAndReserveBtn: "Pay & Reserve Service",
    serviceConfirmAndReserveFreeBtn: "Confirm & Reserve In-Shop (₡0)",
    serviceTransferAmount: "Amount to Transfer for Service",
    serviceFreeTransportNotice: "In-shop service with zero additional transit fee (₡0)",
    serviceUploadingReceipt: "Uploading payment receipt...",
    serviceRegisteringReservation: "Registering service reservation...",
    servicePaymentReceiptRequired: "You must attach the bank transfer payment receipt",
    servicePhoneRequired: "Please enter a contact phone number",
    serviceTermsRequired: "You must accept the Payment Terms and Conditions",
    servicePaymentAccountsHeading: "Official Bank Accounts for Service Payment",
    servicePaymentAccountsSubtitle: "Complete your bank transfer and attach your receipt below",
    servicePaymentProofSuccess: "Service scheduled and payment receipt recorded successfully!",
    servicePhoneInputLabel: "Contact Phone / WhatsApp (Required)",
    servicePhoneInputHelp: "Used by our dispatch driver and technical team to coordinate upon arrival.",
    servicePaymentAgreementNotice: "ZxZ Mods is not responsible for transfers made to wrong accounts or inaccurate amounts. Service reservation is finalized upon official funds confirmation.",
    servicePaymentAgreementCheckbox: "I have read, understood, and accept the Payment Terms and Agreements",
    serviceProceedToPaymentBtn: "Proceed to Service Payment",
    serviceProceedToConfirmFreeBtn: "Confirm Workshop Reservation (₡0)",
    serviceOrdersDeselect: "Deselect",
    serviceOrdersDeselectAll: "Clear all",
    serviceOrdersMultiAllowed: "You can select 2 or more orders for delivery or in-shop installation",
    serviceOrdersSingleOnly: "Individual service: 1 order per vehicle",
    serviceBackToServices: "Back to Service Configuration",
    servicePaymentStepTitle: "Service Payment & Confirmation",
    servicePaymentStepSubtitle: "Transfer the service fee and upload your voucher to secure your date and time",
    serviceSummaryTitle: "Scheduled Service Details",
    serviceMultipleOrdersCount: "selected orders",
    serviceSelectedOrdersLabel: "Orders Included in this Service",
    serviceHomeInstallIneligibleBadge: "Ineligible for home install",
    serviceHomeInstallIneligibleReason: "Your order includes parts or upgrades requiring specialized workshop tools that are ineligible for home installation.",
    serviceHomeInstallIneligibleOrderAlert: "This order contains products that do not qualify for home installation. This option is unavailable.",
    serviceHomeInstallAutoSwitchedNotice: "Switched to 'In-Shop Installation' automatically because the order contains products ineligible for home installation.",
    serviceHomeInstallBackendDisqualified: "The order contains products that do not qualify for home installation. Please select in-shop installation or delivery.",
    serviceHomeInstallOrderTag: "Shop / Delivery Only",
    serviceOrdersInstallFeeLabel: "Installation of parts from order",
    serviceTransportFeeLabel: "Technical transport & dispatch",
    serviceTotalWithInstallLabel: "Total Service & Installation",
    servicePickupInstallHeading: "Pending installation",
    servicePickupInstallPaidOnRetrievalNotice: "Parts installation cost will be paid upon vehicle retrieval or delivery (not included in this booking payment).",
    serviceShopInstallReserveBtn: "Reserve Workshop Appointment (₡0)",
    serviceShopInstallNotice: "Date reservation without upfront cost. Installation labor will be paid during the 'Installation Payment' stage.",
    serviceShopInstallOverlayTitle: "Installation Appointment Reserved!",
    serviceShopInstallOverlaySub: "Your ZxZ workshop appointment has been confirmed without upfront cost. Labor will be paid in the Installation Payment stage.",
    serviceSubtotalNetLabel: "Net Subtotal",
    serviceIvaTaxLabel: "VAT (13%)",
    serviceOrderAlreadyInConfirmation: "This order is already in service payment confirmation. It cannot be selected for another service.",
    serviceOrderAlreadyProgrammed: "This order already has a service scheduled and cannot be selected again.",
    serviceOrderAlreadyProgrammedBadge: "Service Already Scheduled",
    serviceSlotCollisionAlert: "The selected time slot was just reserved by another customer. Please choose a different date or time.",
    servicePayWithCardBac: "Pay with Card (BAC Compra Click)",
    servicePayWithCardBacDesc: "Request a secure BAC Compra Click link via WhatsApp to pay for your service with credit or debit card.",
    servicePayWithCardGenerating: "Generating BAC Compra Click request and opening WhatsApp...",
    installationPayWithCardBac: "Pay with Card (BAC Compra Click)",
    installationPayWithCardBacDesc: "Request a secure BAC Compra Click link via WhatsApp to pay for installation labor with card.",
    installationPayWithCardGenerating: "Generating BAC Compra Click request and opening WhatsApp...",
    serviceTotalWithIvaLabel: "Total with 13% VAT",
    servicePricesIncludeIvaBadge: "13% VAT Included",
    installationLaborSubtotalLabel: "Labor Subtotal",
    installationIvaTaxLabel: "Labor VAT (13%)",
    installationTotalWithIvaLabel: "Total to Transfer (13% VAT inc.)",
    backdoorBlockHoursModalTitle: "Block Hours or Day in Agenda",
    backdoorBlockModeLabel: "Block Type",
    backdoorBlockModeHours: "Specific Hours of the Day",
    backdoorBlockModeDay: "Full Day",
    backdoorBlockModeRuta: "Ruta BarrialCR (Rides)",
    backdoorBlockStartHour: "Start Hour (24h)",
    backdoorBlockEndHour: "End Hour (24h)",
    backdoorBlockReasonLabel: "Reason / Task (e.g. Workshop Technical Installation)",
    backdoorBlockSaveBtn: "Apply Block",
    backdoorBlockedHoursBadge: "Blocked Hours (Workshop)",
    serviceBlockedHoursNotice: "Time slot reserved by workshop for internal installations",
    serviceInTransitNotice: "Time slot unavailable: technical staff is on the road / external dispatch",
    backdoorVehiclesTab: "Garage Vehicles",
    backdoorVehiclesTitle: "Vehicle Catalog for My Garage",
    backdoorVehiclesSubtitle: "Add, edit, and organize vehicles, brands, and models that customers can select and register in their Garage.",
    backdoorVehiclesAddBtn: "+ Add Vehicle",
    backdoorVehiclesTotalBrands: "Registered Brands",
    backdoorVehiclesTotalModels: "Available Models",
    backdoorVehiclesSearchPlaceholder: "Search by model or brand...",
    backdoorVehiclesFilterAllBrands: "All Brands",
    backdoorVehiclesFilterAllCategories: "All Categories",
    backdoorVehiclesModalCreateTitle: "Add New Vehicle Model",
    backdoorVehiclesModalEditTitle: "Edit Vehicle Model",
    backdoorVehiclesBrandLabel: "Vehicle Brand",
    backdoorVehiclesSelectBrandPrompt: "-- Select a Brand --",
    backdoorVehiclesCreateNewBrandToggle: "+ Create New Brand",
    backdoorVehiclesNewBrandName: "New Brand Name",
    backdoorVehiclesNewBrandSlug: "Brand Slug (e.g. can-am, polaris)",
    backdoorVehiclesModelNameLabel: "Model Name (e.g. ZForce Z10)",
    backdoorVehiclesModelSlugLabel: "Model Slug (e.g. zforce-z10)",
    backdoorVehiclesModelCodeLabel: "Vehicle / Model SKU Code",
    backdoorVehiclesModelCodePlaceholder: "e.g. Z10, X3, PROR, TALON",
    backdoorVehiclesModelCodeHelp: "SKU prefix used when automatically generating products for this vehicle",
    backdoorVehiclesCategoryLabel: "Vehicle Category",
    backdoorVehiclesYearsLabel: "Compatible Years",
    backdoorVehiclesYearFromLabel: "From Year",
    backdoorVehiclesYearToLabel: "To Year",
    backdoorVehiclesImageUrlLabel: "Vehicle Image URL (Optional)",
    backdoorVehiclesUploadImageBtn: "Upload Vehicle Image",
    backdoorVehiclesUploadingImage: "Uploading image...",
    backdoorVehiclesRemoveImageBtn: "Remove image",
    backdoorVehiclesChangeImageBtn: "Change image",
    backdoorVehiclesSaveSuccess: "Vehicle successfully added to Garage catalog!",
    backdoorVehiclesUpdateSuccess: "Vehicle successfully updated!",
    backdoorVehiclesDeleteConfirm: "Are you sure you want to delete this vehicle model from Garage?",
    backdoorVehiclesDeleteSuccess: "Vehicle model deleted.",
    backdoorVehiclesEmptyState: "No vehicle models found matching this filter.",
    backdoorVehiclesPickupEligibleLabel: "Compatible with Pick-up (Trailer)",
    backdoorVehiclesPickupEligibleHelp: "Indicates whether this vehicle model qualifies for transport on a trailer or platform.",

    // Garage Brands Management Keys
    backdoorVehiclesSubtabModels: "Vehicle Models",
    backdoorVehiclesSubtabBrands: "Vehicle Brands",
    backdoorVehiclesBrandsTitle: "Garage Vehicle Brands Manager",
    backdoorVehiclesBrandsSubtitle: "Add, edit, and organize vehicle brands, their official logos, and default vehicle images displayed in the Garage.",
    backdoorVehiclesAddBrandBtn: "+ Add Brand",
    backdoorVehiclesEditBrandBtn: "Edit Brand",
    backdoorVehiclesBrandModalCreateTitle: "Add New Vehicle Brand",
    backdoorVehiclesBrandModalEditTitle: "Edit Vehicle Brand",
    backdoorVehiclesBrandNameLabel: "Brand Name (e.g. CAN-AM, CFMOTO)",
    backdoorVehiclesBrandSlugLabel: "Slug / Identifier (e.g. can-am, cfmoto)",
    backdoorVehiclesBrandLogoLabel: "Official Brand Logo",
    backdoorVehiclesBrandUploadLogoBtn: "Upload Logo",
    backdoorVehiclesBrandUploadingLogo: "Uploading logo...",
    backdoorVehiclesBrandDefaultVehicleImgLabel: "Default Vehicle Image",
    backdoorVehiclesBrandDefaultVehicleImgHelp: "This image will be automatically shown in the garage for any registered vehicle of this brand that does not have a specific image configured.",
    backdoorVehiclesBrandUploadVehicleImgBtn: "Upload Vehicle Image",
    backdoorVehiclesBrandUploadingVehicleImg: "Uploading image...",
    backdoorVehiclesBrandDescEsLabel: "Spanish Description",
    backdoorVehiclesBrandDescEnLabel: "English Description",
    backdoorVehiclesBrandFeaturedLabel: "Featured Brand",
    backdoorVehiclesBrandFeaturedHelp: "Show this brand with visual priority in filters and catalogs.",
    backdoorVehiclesBrandSaveSuccess: "Brand created successfully!",
    backdoorVehiclesBrandUpdateSuccess: "Brand updated successfully!",
    backdoorVehiclesBrandDeleteConfirm: "Are you sure you want to delete this vehicle brand? Models associated with this brand will also be removed.",
    backdoorVehiclesBrandDeleteSuccess: "Vehicle brand deleted successfully.",
    backdoorVehiclesBrandEmptyState: "No vehicle brands found matching this filter.",
    backdoorVehiclesBrandSearchPlaceholder: "Search by brand name, slug, or description...",
    backdoorVehiclesBrandFilterAll: "All Brands",
    backdoorVehiclesBrandFilterFeatured: "Featured Only",
    backdoorVehiclesBrandFilterStandard: "Standard",
    backdoorVehiclesBrandModelsCount: "registered models",

    // Pick-Up Service Garage Vehicle Compatibility Keys
    servicePickupVehicleIncompatibleBadge: "Vehicle Incompatible with Pick-up",
    servicePickupVehicleIncompatibleAlert: "The vehicle in your garage is not compatible with trailer transport service.",
    servicePickupVehicleIncompatibleDesc: "Your registered vehicle does not qualify for trailer pick-up service per our technical catalog.",
    servicePickupVehicleCompatibleBadge: "Vehicle Compatible with Pick-up",
    servicePickupNoGarageVehicleNotice: "Please select or register a vehicle in My Garage to verify compatibility with the Pick-up service.",
    servicePickupGarageVehicleLabel: "Garage Vehicle:",
    servicePickupOpenGarageBtn: "Open My Garage",
    servicePickupCompatVerifiedNotice: "Compatibility verified for platform transport with your vehicle.",
    servicePickupGarageCompatTitle: "My Garage Compatibility",
    servicePickupGarageCompatSubtitle: "Verification of registered vehicle for trailer / platform transport.",
    servicePickupGarageCompatSuccess: "Your garage vehicle qualifies for trailer / platform transport.",
    servicePickupGarageCompatFail: "This vehicle model does not qualify for trailer transport per our technical catalog.",

    // New translations for Agenda, Bank Accounts, Unsaved Changes & Order status
    orderStatusPreparingOrder: "Payment confirmed, preparing order",
    orderStatusPreparingOrderDesc: "Payment verified and received. Preparing order parts procurement.",
    orderTransportOnlyAfterPaymentNotice: "Transport service can only be scheduled once order payment has been confirmed.",
    devUnsavedChangesTitle: "Discard unsaved changes?",
    devUnsavedChangesPrompt: "You have unsaved changes in this product. If you leave now, all modifications will be lost.",
    devUnsavedChangesStay: "Keep editing",
    devUnsavedChangesDiscard: "Discard & leave",
    backdoorAgendaTab: "Agenda & Calendar",
    backdoorBankAccountsTab: "Bank Accounts",
    backdoorBankAccountsTitle: "Official Bank Accounts (Master Only)",
    backdoorBankAccountsSubtitle: "Manage official IBAN bank accounts where customers send wire transfer payments.",
    backdoorBankAccountsAddBtn: "+ Add Bank Account",
    backdoorBankAccountsEditTitle: "Edit Bank Account",
    backdoorBankAccountsCreateTitle: "New Bank Account",
    backdoorBankAccountsDeleteConfirm: "Are you sure you want to delete this bank account?",
    backdoorBankAccountsDeleteSuccess: "Bank account successfully deleted.",
    backdoorBankAccountsSaveSuccess: "Bank account successfully saved.",
    backdoorBankAccountsSubTabAccounts: "Bank Accounts",
    backdoorBankAccountsSubTabDiscounts: "Discount Codes (Master)",
    backdoorExchangeRateTab: "Exchange Rate (USD)",
    backdoorExchangeRateTitle: "USD Sell Exchange Rate & BCCR API",
    backdoorExchangeRateSubtitle: "Manage the USD exchange rate used for quotes, cart, and checkout. Sync live with the Central Bank of Costa Rica (BCCR) or set a custom manual rate.",
    backdoorExchangeRateLiveLabel: "Active / Official Sell Rate (USD)",
    backdoorExchangeRateBuyLabel: "Buy Rate (USD)",
    backdoorExchangeRateAutoMode: "Automatic BCCR Sync",
    backdoorExchangeRateManualMode: "Manual Mode (Modify / Fix Value)",
    backdoorExchangeRateAutoDesc: "The system queries Central Bank of Costa Rica (BCCR) feeds daily and updates the rate automatically.",
    backdoorExchangeRateManualDesc: "Fix a specific manual exchange rate. This rate will override all quotes until you switch back to automatic.",
    backdoorExchangeRateInputLabel: "USD Sell Value (₡ per $1 USD)",
    backdoorExchangeRateBuyInputLabel: "USD Buy Value (₡ per $1 USD)",
    backdoorExchangeRateNotesLabel: "Reason / Note for Manual Override",
    backdoorExchangeRateNotesPlaceholder: "e.g. Commercial bank rate / Volatility adjustment",
    backdoorExchangeRateSaveManualBtn: "Save Manual Rate",
    backdoorExchangeRateRestoreAutoBtn: "Return to Automatic BCCR Sync",
    backdoorExchangeRateSyncNowBtn: "Test & Sync Live BCCR",
    backdoorExchangeRateDiagnosticsTitle: "BCCR API Providers & Diagnostics",
    backdoorExchangeRateProviderStatus: "Status",
    backdoorExchangeRateLatency: "Latency",
    backdoorExchangeRateStatusActive: "BCCR Synced",
    backdoorExchangeRateStatusOverride: "Manual Override Active",
    backdoorExchangeRateLastSync: "Last synced",
    backdoorBankAccountsSubTabExchangeRate: "Exchange Rate / USD (BCCR)",
    backdoorBankAccountsExchangeSectionTitle: "Official USD Exchange Rate (Sell / Buy)",
    backdoorBankAccountsExchangeSectionDesc: "The USD rate is used to convert quoted products and compute exact amounts in dollar payments.",
    backdoorBankAccountsManageExchangeBtn: "Configure / Modify Exchange Rate",
    backdoorDiscountsTitle: "Official Discount Codes (Master Only)",
    backdoorDiscountsSubtitle: "Create, activate, and manage discount coupons applicable automatically at the checkout screen.",
    backdoorDiscountsAddBtn: "+ Create Discount Code",
    backdoorDiscountsEditTitle: "Edit Discount Code",
    backdoorDiscountsCreateTitle: "New Discount Code",
    backdoorDiscountsDeleteConfirm: "Are you sure you want to permanently delete this discount code?",
    backdoorDiscountsSaveSuccess: "Discount code saved successfully.",
    backdoorDiscountsDeleteSuccess: "Discount code deleted successfully.",
    backdoorDiscountsCode: "Discount Code",
    backdoorDiscountsCodePlaceholder: "e.g. ZXZ10, PROMO5000, VIPRIDER",
    backdoorDiscountsDescription: "Description / Internal Note",
    backdoorDiscountsDescriptionPlaceholder: "e.g. 10% seasonal discount on parts",
    backdoorDiscountsType: "Discount Type",
    backdoorDiscountsTypePercentage: "Percentage (%)",
    backdoorDiscountsTypeFixed: "Fixed Amount (₡ CRC)",
    backdoorDiscountsValue: "Discount Value",
    backdoorDiscountsMinOrder: "Minimum Parts Subtotal (₡)",
    backdoorDiscountsMaxDiscount: "Maximum Discount Amount (₡, optional for %)",
    backdoorDiscountsMaxUses: "Usage Limit (leave empty for unlimited)",
    backdoorDiscountsUsesCount: "Times Used",
    backdoorDiscountsExpiresAt: "Expiration Date (optional)",
    backdoorDiscountsStatusActive: "Active (Available)",
    backdoorDiscountsStatusInactive: "Inactive (Disabled)",
    backdoorDiscountsEmpty: "No discount codes registered yet. Click '+ Create Discount Code' to generate the first one.",
    checkoutDiscountTitle: "Have a Discount Code?",
    checkoutDiscountPlaceholder: "Enter your coupon code (e.g. ZXZ10)",
    checkoutDiscountApplyBtn: "Apply Coupon",
    checkoutDiscountApplying: "Validating...",
    checkoutDiscountRemoveBtn: "Remove",
    checkoutDiscountAppliedSuccess: "Discount coupon applied successfully!",
    checkoutDiscountRowLabel: "Applied Discount",
    backdoorAgendaTitle: "Services & Transport Agenda",
    backdoorAgendaSubtitle: "View and manage all scheduled installation and transport services in Google Calendar style and chronological list.",
    backdoorAgendaCalendarView: "Calendar View (Google Calendar)",
    backdoorAgendaWeekView: "Week (Google Calendar)",
    backdoorAgendaMonthView: "Month",
    backdoorAgendaWarrantyTab: "Warranty Protection (GAR)",
    backdoorAgendaWeekInstallsOnly: "Installations Only",
    backdoorAgendaWeekAllServices: "All Services (General)",
    backdoorAgendaWeekCurrentTime: "Current time",
    backdoorAgendaWarrantyCount: "Warranty Orders",
    backdoorAgendaWarrantyDesc: "Prior disassembly and reinstallation of ZxZ parts for dealer inspections",
    backdoorAgendaChronologicalView: "Chronological List (Upcoming Services)",
    backdoorAgendaScheduleServiceBtn: "Schedule Service (/servicios)",
    backdoorAgendaServiceDetails: "Service Details",
    backdoorAgendaTransportPaymentConfirmed: "Transport Payment Confirmed",
    backdoorAgendaTransportPaymentPending: "Transport Payment Pending",
    backdoorAgendaConfirmTransportPaymentBtn: "Confirm Transport Payment",
    backdoorAgendaTransportPaymentSuccess: "Transport payment successfully confirmed.",
    backdoorBlockDaysBtn: "Block Days",
    backdoorBlockDaysTitle: "Blocked Days Management",
    backdoorBlockDaysSubtitle: "Block entire days for services or assign events such as Ruta BarrialCR.",
    backdoorBlockDayToggle: "Block this day",
    backdoorRutaBarrialToggle: "Block for Ruta BarrialCR (Rides Organization)",
    backdoorSaveBlockBtn: "Save Date Block",
    backdoorUnblockBtn: "Unblock Date",
    backdoorAppointmentCodeLabel: "Appointment Code",
    backdoorSearchByCodeOrOrder: "Search by code (#SRV-... / #BLK-...), order, or client...",
    backdoorEditAppointmentTitle: "Edit Service Appointment",
    backdoorEliminateAppointmentBtn: "Eliminate Appointment",
    backdoorEliminateAppointmentConfirm: "Are you sure you want to permanently delete this service appointment? This action cannot be undone.",
    backdoorEliminateAppointmentSuccess: "Appointment deleted successfully.",
    backdoorSaveAppointmentBtn: "Save Appointment Changes",
    backdoorTimeOverrideNote: "Workshop schedule enabled from 8:00 AM to 8:00 PM (08:00 - 20:00)",
    backdoorSearchOrderPlaceholder: "Search by order number (#COT-... or #ZXZ-...) or customer...",
    backdoorSelectedOrderLabel: "Selected Order",
    backdoorChangeOrderBtn: "Change Order",
    calendarRutaBarrialBadge: "Ruta BarrialCR",
    calendarDayBlockedBadge: "Day Blocked",

    // Backdoor Home Page Content Manager
    backdoorHomePageTab: "Home Page Content",
    backdoorHomePageTitle: "Home Page Videos & Products Manager",
    backdoorHomePageSubtitle: "Add or update featured videos and products displayed on the home page, including redirect links, category, short description, and title.",
    backdoorHomeAllItems: "All Items",
    backdoorHomeVideos: "Featured Videos",
    backdoorHomeProducts: "Featured Products",
    backdoorHomeAddItem: "Add Item",
    backdoorHomeEditItem: "Edit Item",
    backdoorHomeDeleteItem: "Delete",
    backdoorHomeItemType: "Item Type",
    backdoorHomeTypeVideo: "Hero Video",
    backdoorHomeTypeProduct: "Showcase Product",
    backdoorHomeTitleEs: "Title (Spanish)",
    backdoorHomeTitleEn: "Title (English)",
    backdoorHomeCategory: "Category",
    backdoorHomeCategoryPlaceholder: "E.g.: Software & Power, CFMOTO Specialty, Exhausts...",
    backdoorHomeDescEs: "Short Description (Spanish)",
    backdoorHomeDescEn: "Short Description (English)",
    backdoorHomeRedirectUrl: "Redirect URL or Path",
    backdoorHomeRedirectPlaceholder: "E.g.: /performance, /marcas, /cotizar, /combos...",
    backdoorHomeMediaUrl: "Image / Poster URL",
    backdoorHomeMediaPlaceholder: "https://... or image path",
    backdoorHomeVideoUrl: "MP4 Video URL (Optional)",
    backdoorHomeVideoPlaceholder: "https://... or .mp4 video path",
    backdoorHomeOrder: "Display Order",
    backdoorHomeIsActive: "Visible on Home Page",
    backdoorHomeStatusActive: "Active",
    backdoorHomeStatusInactive: "Inactive",
    backdoorHomeSaveBtn: "Save Item",
    backdoorHomeSaving: "Saving...",
    backdoorHomeCancelBtn: "Cancel",
    backdoorHomeDeleteConfirm: "Are you sure you want to permanently delete this home page item?",
    backdoorHomeEmptyState: "No home page items found. Add the first one using the button above.",
    backdoorHomeSuccessCreated: "Item successfully added to the home page.",
    backdoorHomeSuccessUpdated: "Item successfully updated.",
    backdoorHomeSuccessDeleted: "Item removed from the home page.",
    backdoorHomeActions: "Actions",
    backdoorHomeSearchPlaceholder: "Search by title or category...",
    backdoorHomeUploadImageBtn: "Upload Image",
    backdoorHomeUploadVideoBtn: "Upload Video (MP4 / WebM / MOV)",
    backdoorHomeUploadingImage: "Uploading image...",
    backdoorHomeUploadingVideo: "Uploading video...",
    backdoorHomeChangeImage: "Change Image",
    backdoorHomeChangeVideo: "Change Video",
    backdoorHomeRemoveImage: "Remove Image",
    backdoorHomeRemoveVideo: "Remove Video",
    backdoorHomeManualUrlToggle: "Or enter manual URL",
    heroRelatedModalTitle: "Featured Gear & Upgrades",
    heroRelatedModalSubtitle: "Products and combos featured in this video. Select one to view details:",
    heroRelatedProductBadge: "Product",
    heroRelatedComboBadge: "Combo",
    heroRelatedViewProduct: "View Product",
    heroRelatedViewCombo: "View Combo",
    heroRelatedCloseModal: "Close",
    backdoorHomeRelatedItemsSectionTitle: "Related Products / Combos to Video",
    backdoorHomeRelatedItemsSectionDesc: "If you add 2 or more products/combos, the 'Learn More' button will open an interactive pop-up so the customer can pick which one to explore. If 0 or 1 is added, it keeps the direct link.",
    backdoorHomeRelatedAddBtn: "Add Product or Combo",
    backdoorHomeRelatedSearchPlaceholder: "Search by name, SKU or category...",
    backdoorHomeRelatedEmpty: "No products or combos linked to this video yet.",
    backdoorHomeRelatedReplaceBtn: "Replace",
    backdoorHomeRelatedRemoveBtn: "Remove",
    backdoorHomeRelatedReplacingMode: "Click a product or combo from the catalog to replace:",
    backdoorHomeRelatedCancelReplace: "Cancel replace",
    backdoorHomeRelatedFilterAll: "All",
    backdoorHomeRelatedFilterProducts: "Products",
    backdoorHomeRelatedFilterCombos: "Combos",
    backdoorHomeSubTabMedia: "Videos & Products",
    backdoorHomeSubTabDealerBrands: "Dealer Brands",
    backdoorDealerBrandsTitle: "Dealer Brands (Home Wheel)",
    backdoorDealerBrandsSubtitle: "Manage dealer and aftermarket brand logos rotating in the continuous home page wheel, along with their search redirect when clicked.",
    backdoorDealerBrandsAllCount: "Registered Brands",
    backdoorDealerBrandsAddBtn: "Add Dealer Brand",
    backdoorDealerBrandsEditBtn: "Edit Dealer Brand",
    backdoorDealerBrandsName: "Brand Name",
    backdoorDealerBrandsNamePlaceholder: "E.g.: Bikeman Performance, SuperATV, Dynojet...",
    backdoorDealerBrandsCode: "Dealer Brand SKU Code",
    backdoorDealerBrandsCodePlaceholder: "e.g. BMP, EVP, RPM, DRT",
    backdoorDealerBrandsCodeHelp: "Base code used to automatically generate product SKUs for this brand",
    backdoorDealerBrandsLogo: "Brand Logo / Image",
    backdoorDealerBrandsUploadLogo: "Upload Logo (PNG, SVG, JPG)",
    backdoorDealerBrandsUploadingLogo: "Uploading logo...",
    backdoorDealerBrandsChangeLogo: "Change Logo",
    backdoorDealerBrandsRemoveLogo: "Remove Logo",
    backdoorDealerBrandsRedirectUrl: "Search Redirect URL on Click",
    backdoorDealerBrandsRedirectPlaceholder: "E.g.: /productos?brand=Bikeman or /productos?q=Bikeman",
    backdoorDealerBrandsAutoRedirectHint: "Generate automatic search",
    backdoorDealerBrandsOrder: "Rotation Order in Wheel",
    backdoorDealerBrandsIsActive: "Visible in Home Wheel",
    backdoorDealerBrandsDeleteConfirm: "Are you sure you want to permanently delete this dealer brand from the home wheel?",
    backdoorDealerBrandsEmpty: "No dealer brands registered yet. Add the first one to display it on the home page wheel.",
    backdoorDealerBrandsSuccessCreated: "Dealer brand successfully added to the wheel.",
    backdoorDealerBrandsSuccessUpdated: "Dealer brand successfully updated.",
    backdoorDealerBrandsSuccessDeleted: "Dealer brand removed successfully.",
    backdoorDealerBrandsSearchPlaceholder: "Search dealer brand by name...",
    backdoorDealerBrandsWheelPreview: "Wheel Preview",

    // BarrialCR Community & Page
    barrialCrHeroBadge: "Official Community",
    barrialCrScrollDown: "Scroll to explore the community",
    barrialCrAboutTitle: "About BarrialCR Community",
    barrialCrRidesTitle: "Rides & Expeditions in Costa Rica",
    barrialCrJoinChatPrompt: "Ready for the next ride? Join the official BarrialCR WhatsApp group and hit the trails with us across Costa Rica.",
    barrialCrLoading: "Loading BarrialCR community...",
    barrialCrBadgeCommunity: "Official Community",
    barrialCrBadgeRutas: "Trails & Expeditions",
    barrialCrBadgeCostaRica: "Costa Rica 4x4",
    barrialCrUpcomingRidesTitle: "Upcoming Official BarrialCR Rides",
    barrialCrUpcomingRidesSubtitle: "Dates scheduled on the official calendar. Prep your machine and join us on the next off-road expedition.",
    barrialCrNoRidesPlanned: "Upcoming Rides in Planning",
    barrialCrNoRidesSub: "Next routes across Costa Rica are currently being planned. Join our official WhatsApp group to get date alerts before spots fill up.",
    barrialCrRideConfirmed: "Confirmed Ride",
    barrialCrRideMeetingPoint: "Meeting Point",
    barrialCrRideTime: "Departure Time",
    barrialCrRideJoinWhatsApp: "Join this Ride (WhatsApp)",
    barrialCrRidePastBadge: "Past Ride",
    barrialCrCalendarSyncNotice: "Real-time sync with ZxZ Mods Official Calendar",
    backdoorBarrialCrCalendarRidesTitle: "BarrialCR Rides on Calendar / Schedule",
    backdoorBarrialCrCalendarRidesSubtitle: "Rides and expeditions registered on the system schedule. When a date is added or blocked as a Ruta BarrialCR in the agenda, it will automatically display on the public BarrialCR page.",
    backdoorBarrialCrAddRideBtn: "Schedule New Ride",
    backdoorBarrialCrNoCalendarRides: "No BarrialCR rides currently scheduled on the calendar.",

    // Backdoor BarrialCR Manager
    backdoorHomeSubTabBarrialCr: "BarrialCR",
    backdoorBarrialCrTitle: "BarrialCR Screen Settings",
    backdoorBarrialCrSubtitle: "Configure background video, header titles, group logo, community description, and the official WhatsApp chat link.",
    backdoorBarrialCrHeroSettings: "Background Video & Hero Header",
    backdoorBarrialCrVideoUrl: "Background Video URL (MP4)",
    backdoorBarrialCrUploadVideo: "Upload MP4 Video",
    backdoorBarrialCrUploadingVideo: "Uploading video...",
    backdoorBarrialCrPosterUrl: "Cover Poster Image",
    backdoorBarrialCrUploadPoster: "Upload Cover",
    backdoorBarrialCrTitleLabel: "Centered Title over Video",
    backdoorBarrialCrSubtitleEs: "Intro Subtitle (Spanish)",
    backdoorBarrialCrSubtitleEn: "Intro Subtitle (English)",
    backdoorBarrialCrCommunitySettings: "Community Details & Logo",
    backdoorBarrialCrLogoUrl: "Official BarrialCR Logo",
    backdoorBarrialCrUploadLogo: "Upload Logo",
    backdoorBarrialCrUploadingLogo: "Uploading logo...",
    backdoorBarrialCrDescEs: "Community Description (Spanish)",
    backdoorBarrialCrDescEn: "Community Description (English)",
    backdoorBarrialCrWhatsappLink: "WhatsApp Group Invite Link",
    backdoorBarrialCrWhatsappLinkHelp: "Enter official group invite URL (e.g. https://chat.whatsapp.com/... or https://wa.me/...)",
    backdoorBarrialCrWhatsappBtnEs: "WhatsApp Button Text (Spanish)",
    backdoorBarrialCrWhatsappBtnEn: "WhatsApp Button Text (English)",
    backdoorBarrialCrStatusLabel: "BarrialCR Screen Status",
    backdoorBarrialCrStatusActive: "Public Page Visible & Active",
    backdoorBarrialCrStatusInactive: "Page Hidden / Maintenance",
    backdoorBarrialCrSaveBtn: "Save BarrialCR Changes",
    backdoorBarrialCrSaving: "Saving Changes...",
    backdoorBarrialCrSuccessSaved: "BarrialCR settings updated successfully!",
    backdoorBarrialCrPreviewBtn: "View Live BarrialCR Screen",
    backdoorWorkshopTab: "HQ & Phone",
    backdoorWorkshopTitle: "Workshop HQ & Customer Support Phone Configuration",
    backdoorWorkshopSubtitle: "Update the customer support phone number, WhatsApp, address, and operating hours. These updates automatically reflect on the location screen and throughout the store.",
    backdoorPhoneLabel: "Main Customer Support / Call Phone",
    backdoorPhonePlaceholder: "+506 7033-2560",
    backdoorPhoneHelp: "Official phone number shown on the location screen, contact cards, and direct call buttons.",
    backdoorLegalNameLabel: "Company Legal Entity Name",
    backdoorLegalNamePlaceholder: "E.g.: ZxZ Mods Costa Rica S.A.",
    backdoorLegalNameHelp: "Formal legal entity name shown on purchase receipts, quotations, and official documents.",
    backdoorCedulaJuridicaLabel: "Corporate Tax ID / Cédula Jurídica",
    backdoorCedulaJuridicaPlaceholder: "E.g.: 3-101-436132",
    backdoorCedulaJuridicaHelp: "Corporate legal ID number validating the company on formal purchase receipts.",
    backdoorWhatsappLabel: "Official WhatsApp Number",
    backdoorHoursLabel: "Operating Hours",
    backdoorHoursHelp: "Operating hours shown to customers (e.g., 8:00 AM - 8:00 PM)",
    backdoorAddressLabel: "Physical Address (Spanish)",
    backdoorAddressEnLabel: "Physical Address (English)",
    backdoorSaveWorkshopBtn: "Save Workshop Details",
    backdoorSavingWorkshop: "Saving changes...",
    backdoorWorkshopPreview: "Live Preview (Location Screen)",
    backdoorWorkshopError: "Failed to update workshop details in the database.",
    backdoorSaveContactSuccess: "Workshop phone and contact information updated successfully in the database.",

    // Category multi-select
    devProductCategoriesLabel: "Product Categories",
    devAddAnotherCategoryBtn: "+ Add another category",
    devSelectCategoryToAdd: "Select category to add...",
    devNoCategoriesSelected: "No categories selected",

    // Dealer Warranty Protection & Voids Warranty
    devVoidsWarrantyLabel: "Voids Dealer Warranty",
    devVoidsWarrantyDesc: "Check this option if installing this product or modification voids the vehicle factory/dealer warranty. The ZxZ Mods Protection Service banner will be displayed.",
    devVoidsWarrantyBadge: "Voids Dealer Warranty",
    warrantyProtectionBannerTitle: "ZxZ Mods Dealer Warranty Protection Service",
    warrantyProtectionBannerDesc: "Worried about your factory warranty? ZxZ Mods uninstalls your upgrades and reinstalls your original OEM parts before dealer visits, charging only the labor cost.",
    warrantyProtectionBannerCta: "Learn About Protection Service",
    warrantyProtectionPageTitle: "Dealer Warranty Protection Service",
    warrantyProtectionPageSubtitle: "Enjoy the ultimate power and performance of your ZxZ Mods upgrades without losing your vehicle's factory dealer warranty coverage.",
    warrantyProtectionHowItWorksTitle: "How Does the Protection Service Work?",
    warrantyProtectionStep1Title: "1. Schedule Your Pre-Dealer Appointment",
    warrantyProtectionStep1Desc: "Before taking your UTV or vehicle for scheduled maintenance or dealer warranty inspections, contact us to schedule temporary removal at our shop or at your home.",
    warrantyProtectionStep2Title: "2. OEM Parts Reinstallation",
    warrantyProtectionStep2Desc: "Our certified technicians safely remove your performance parts and reinstall the original OEM factory components with factory torque specifications.",
    warrantyProtectionStep3Title: "3. Pay Only for Labor",
    warrantyProtectionStep3Desc: "No marked-up part prices or surprise fees! You only pay the fair labor rate for the technician's time required for disassembly and reassembly.",
    warrantyProtectionStep4Title: "4. Post-Dealer Reinstallation",
    warrantyProtectionStep4Desc: "Once dealer inspection and maintenance are successfully completed, bring your vehicle back and we'll reinstall your performance mods at a preferential rate.",
    warrantyProtectionFaqTitle: "Frequently Asked Questions",
    warrantyProtectionFaq1Q: "What products are covered by this service?",
    warrantyProtectionFaq1A: "Applicable to charge tubes, full exhaust systems, ECU tunes, clutch kits, intercoolers, cold air intakes, and any performance upgrade marked with the warranty void notice.",
    warrantyProtectionFaq2Q: "How long does the OEM swap take?",
    warrantyProtectionFaq2A: "Most temporary uninstalls and OEM re-installations take between 2 to 4 hours in our shop or mobile service, depending on vehicle preparation.",
    warrantyProtectionFaq3Q: "What should I do with my original OEM parts after buying mods?",
    warrantyProtectionFaq3A: "Keep them in your garage or leave them safely stored in our shop so they are ready for your pre-dealer appointment.",
    warrantyProtectionContactBtn: "Coordinate Warranty Protection via WhatsApp",
    warrantyProtectionBackBtn: "Back to Products",
    warrantyProtectionProfileBtn: "Warranty Protection",
    warrantyProtectionProfileSubtitle: "De-install & reinstall of warranty-voiding parts",
    warrantyProtectionPartsTitle: "Registered Warranty Protection Parts",
    warrantyProtectionPartsSubtitle: "Your ZxZ parts that void dealer warranty, ready for de-installation and re-installation",
    warrantyProtectionCostFormula: "De-installation & Re-installation Cost (Installation × 2)",
    warrantyProtectionInstallCostLabel: "Base installation:",
    warrantyProtectionDeinstallReinstallLabel: "De-install + Re-install [Installation × 2]:",
    warrantyProtectionSelectParts: "Select parts for process",
    warrantyProtectionProceedService: "Proceed to Service Selection (Workshop, Home, Platform)",
    warrantyProtectionGoToScreen: "Learn more about Warranty Protection",
    warrantyProtectionNoParts: "You do not have any registered parts that void dealer warranty yet",
    warrantyProtectionNoPartsDesc: "When you purchase performance upgrades at ZxZ Mods (sports exhausts, ECU remapping, clutch kits), they will automatically appear here to protect your factory warranty.",
    warrantyProtectionOnlyZxzNotice: "Only parts purchased at ZxZ Mods can be uninstalled and reinstalled under this service.",
    warrantyProtectionTotalToPay: "Total Labor (De-installation + Re-installation):",
    warrantyProtectionCreatingOrder: "Preparing service order...",
    warrantyProtectionLoginRequired: "Log in to manage your vehicle's parts",
    warrantyProtectionLoginPrompt: "Log in with your account to view purchased ZxZ Mods parts covered by dealer warranty protection.",
    warrantyProtectionExploreCatalog: "Explore Performance Catalog",
    warrantyProtectionSelectedCount: "parts selected",

    // Related / Recommended Products
    devRelatedProductsTitle: "Highly Related Products (Recommended)",
    devRelatedProductsDesc: "Select recommended or complementary parts that will be displayed on the product page for cross-selling.",
    devAddRelatedProductPlaceholder: "Search and add related product...",
    devNoRelatedProducts: "No related products assigned yet.",
    productRelatedTitle: "Recommended & Related Products",
    productRelatedSubtitle: "Upgrades recommended by the ZxZ Mods technical team to complement this product.",

    // Suggested Products & Combos (For function & damage prevention - distinct from recommended)
    productSuggestionsSectionTitle: "Suggested for Optimal Operation & Prevention",
    productSuggestionsSectionSubtitle: "Suggested components to prevent damage and ensure the most reliable, peak operation.",
    suggestionTypeProduct: "Suggested Product",
    suggestionTypeCombo: "Suggested Combo",
    suggestionBadge: "Prevention & Performance",
    suggestionAddToCart: "+ Add",
    suggestionInCart: "In cart",
    suggestionAddedSuccess: "Added to cart!",
    devSuggestionsTitle: "Suggested (Damage Prevention & Peak Function)",
    devSuggestionsDesc: "Tag products or combos suggested to prevent wear/damage or ensure optimal operation of this part.",
    devSuggestionsSearchPlaceholder: "Search product or combo to suggest...",
    devNoSuggestionsTagged: "No suggested products or combos tagged.",
    devTagTypeAll: "All",
    devTagTypeProducts: "Products",
    devTagTypeCombos: "Combos",

    // Description bullet helper
    devBulletListHelp: "Tip: Start lines with '-' or '•' to automatically format them into clean bullet lists on the storefront.",
    devAddBulletTemplateBtn: "+ Insert Bullet",

    // Product percentage discount
    devProductDiscountPercent: "Product Discount (% OFF)",
    devProductDiscountHelp: "Applies a direct percentage discount to the product's final retail price.",
    devProductBasePrice: "Base Calculated Price (before discount)",
    devProductDiscountAmount: "Discount Amount",
    devProductFinalPrice: "Final Discounted Price",
    devProductNoDiscount: "No Discount (0%)",

    // Profile Banning System (Master Only)
    backdoorUserBansTab: "Profile Bans",
    userBanTitle: "Profile Ban Management (Master Exclusive)",
    userBanSubtitle: "Security console to suspend or reactivate platform users in real-time.",
    userBanSearchPlaceholder: "Type user email address...",
    userBanSearchHelp: "To reduce database queries, search only executes when typing the user email.",
    userBanNoUserFound: "No registered user found with the specified email address.",
    userBanInitialStatePrompt: "Enter a user email address above to look up their profile and manage their ban status.",
    userBanActiveStatus: "Active (Unrestricted)",
    userBanBannedStatus: "Banned / Suspended",
    userBanDateLabel: "Suspension Date",
    userBanReasonLabel: "Ban Reason",
    userBanByLabel: "Banned by",
    userBanActionBanBtn: "Ban User",
    userBanActionUnbanBtn: "Lift Ban / Reactivate",
    userBanModalTitle: "Confirm Profile Ban",
    userBanModalSubtitle: "The user will immediately lose access, cannot log in, and their sessions will be terminated.",
    userBanReasonPrompt: "Ban Reason or Justification:",
    userBanReasonPlaceholder: "E.g. Terms violation, fraudulent payment slips, abusive behavior...",
    userBanConfirmBanBtn: "Confirm and Ban User",
    userBanConfirmUnbanBtn: "Confirm and Reactivate User",
    userBanCancelBtn: "Cancel",
    userBanSuccessBan: "User has been banned and suspended successfully.",
    userBanSuccessUnban: "User suspension has been lifted successfully.",
    userBanRegisteredAt: "Registration Date",
    userBanLastLogin: "Last Login",
    userBanOrdersCount: "Total Orders",
    userBanVehiclesCount: "Garage Vehicles",
    userBanPhoneLabel: "Phone",
    userBanRoleLabel: "System Role",
    userBanCannotBanSelf: "Action blocked: You cannot ban your own Master account.",
    userBanCannotBanMaster: "Action blocked: Accounts with MASTER role cannot be banned.",
    userBanDefaultReason: "Administrative suspension by Master.",
    userBanAccountSuspendedNotice: "Your account has been suspended. Please contact support if you believe this is a mistake.",

    // Physical Service Documents & PDF System
    serviceDocsBtn: "Service Documents (PDF / Print)",
    serviceDocsModalTitle: "Physical & Legal Service Documents",
    serviceDocsModalSubtitle: "Official physical vouchers, reception slips, handover certificates and legal agreements based on selected service.",
    serviceDocsTabReception: "Vehicle Reception",
    serviceDocsTabHandover: "Vehicle Handover",
    serviceDocsTabAgreement: "Agreement & Installation",
    serviceDocsTabTransportAuth: "Transport Authorization",
    serviceDocsTabTransportReturn: "Vehicle Return Handover",
    serviceDocsTabDelivery: "Delivery Manifest",
    serviceDocsPrintBtn: "Print / Save as PDF",
    serviceDocsFillDetails: "Complete Vehicle / Document Details",
    serviceDocsLicensePlate: "License Plate Number",
    serviceDocsVin: "VIN / Chassis",
    serviceDocsMileage: "Hours / Mileage",
    serviceDocsVehicleColor: "Vehicle Color",
    serviceDocsReceiverName: "Receiving Staff / Mechanic",
    serviceDocsPreDamages: "Pre-Existing Damage Inspection (Scratches, dents, etc.)",
    serviceDocsFreeWash: "Free Courtesy Wash Included",
    serviceDocsFreeWashYes: "Yes, client requests free courtesy wash",
    serviceDocsFreeWashNo: "No, client declines wash",
    serviceDocsCedulaLabel: "National ID / Passport",
    serviceDocsOwnerNameLabel: "Vehicle Owner / Client Name",
    serviceDocsSignOwner: "Owner / Client Signature",
    serviceDocsSignStaff: "ZxZ Mods Staff Signature & Stamp",
    serviceDocsSaveDataBtn: "Save Document Details",
    serviceDocsSaveSuccess: "Document details saved successfully to order.",
    serviceDocsKeysCheck: "Vehicle keys received",
    serviceDocsSpareKeyCheck: "Spare key received",
    serviceDocsKeysCount: "Keys count",
    serviceDocsFuelLevel: "Fuel level",
    serviceDocsNoBelongings: "No personal belongings in cabin",
    serviceDocsBatteryCheck: "Battery & ignition operational",
    serviceDocsParkingBrakeCheck: "Parking brake operational",
    serviceDocsTiresCheck: "Tires & rims good condition",
    serviceDocsLeaksCheck: "No visible fluid leaks",
    serviceDocsDocsCheck: "Vehicle documents on board",
    serviceDocsKeysReturnedCheck: "Formal return of vehicle keys to owner",

    // ZxZ Quality Certification (Warehouse Product Checked)
    zxzCertBadge: "ZxZ Quality Certified",
    zxzCertTitle: "ZxZ Warehouse Quality & Inspection Certificate",
    zxzCertSubtitle: "Official document certifying all products were received, technically inspected and approved without defects in warehouse.",
    zxzCertViewBtn: "View ZxZ Quality Certificate",
    zxzCertDownloadBtn: "Print / Save Certificate",
    zxzCertInspector: "Inspecting Technician",
    zxzCertStatusVerified: "Verified & Approved",
    zxzCertCustomerBannerTitle: "Goods Inspected & Certified at ZxZ Workshop",
    zxzCertCustomerBannerSub: "Your parts were unboxed, inspected by the technical crew, and carry the official ZxZ Mods conformity seal.",

    // Pick-Up Service Enable/Disable by Master
    servicePickupDisabledBadge: "Unavailable",
    servicePickupDisabledDesc: "Trailer pick-up service temporarily out of operation due to unit maintenance.",
    servicePickupDisabledAlert: "Vehicle Pick-Up service is temporarily disabled due to transport unit maintenance. You can schedule Shop Installation, Home Installation, or Parts Delivery.",
    backdoorPickupStatusLabel: "Pick-Up Service Availability",
    backdoorPickupEnabledBadge: "ENABLED",
    backdoorPickupDisabledBadge: "DISABLED",
    backdoorPickupEnableBtn: "Enable Pick-Up Service",
    backdoorPickupDisableBtn: "Disable Pick-Up Service",
    backdoorPickupToggleDesc: "Exclusive Master control: Disable the Pick-Up service if the transport vehicle or trailer is under maintenance or out of operation.",

    // Common Breadcrumbs & Navigation
    breadcrumbHome: "Home",
    breadcrumbBrands: "Brands",
    breadcrumbPerformance: "Stage Performance Packages",
    breadcrumbQuote: "Model Quote",
    breadcrumbProducts: "Products",
    breadcrumbCombos: "Combos & Kits",
    breadcrumbOrders: "My Orders",
    breadcrumbTerms: "Terms & Conditions",
    breadcrumbDocuments: "Official Documents",
    btnBackToHome: "Back to Home",
    btnBackToOrders: "Back to My Orders",
    btnBackToOrder: "Back to Order",
    btnExploreProducts: "Explore Products",
    btnExploreShop: "Go to Store",
    btnComingSoon: "Coming Soon",

    // Accessibility & Global Badges
    ariaClearSearch: "Clear search",
    ariaCloseModal: "Close modal",
    ariaCloseProfile: "Close profile",
    ariaCloseCart: "Close cart",
    ariaDecreaseQty: "Decrease quantity",
    ariaIncreaseQty: "Increase quantity",
    ariaPreviousProduct: "Previous product",
    ariaNextProduct: "Next product",
    ariaCloseZoom: "Close enlarged image",
    badgeDiscountOff: "% OFF",
    badgeAudioHd: "HD Audio",
    badgeActiveStatus: "Active",
    labelQuantityShort: "Qty:",
    labelUnitEach: "ea.",
    currencyColonesLabel: "Colones (₡ CRC)",
    currencyDollarsLabel: "Dollars ($ USD)",
    exchangeRateBccrPrefix: "BCCR Rate:",
    vatIncludedNotice: "VAT included",
    warrantyLaborNotice: "In-shop labor warranty included",
    redirectingToOrderClaim: "Redirecting to order claim...",

    // Performance Page (/performance)
    performanceBadge: "Calibration & Dyno Tuning",
    performancePageTitle: "Stage 1 to 3 Performance Packages",
    performancePageSubtitle: "Dyno-proven horsepower levels for UTVs and ATVs. Software tuning, clutching, intake, and high-flow exhausts in Costa Rica.",
    performanceQuoteCustomBtn: "Quote Custom Package",
    performanceMostPopular: "Most Popular",
    performanceHpGainLabel: "HP Gain",
    performanceTorqueGainLabel: "Torque Gain",
    performanceIncludesLabel: "Included in Package:",
    performanceDynoBadge: "Dyno Tuned",
    performanceLaborWarrantyBadge: "ZxZ Labor Warranty",
    performancePricePrefix: "Costa Rica Price:",
    performanceInstallationIncludedNotice: "In-shop installation labor included",
    performanceAddToCartBtn: "Add to Cart",
    performanceAppliesToLabel: "Applies to:",

    // Quote Page (/cotizar)
    quoteBadge: "Direct Quote & Importation",
    quotePageTitle: "Quote Parts & Modifications for Your Model",
    quotePageSubtitle: "Select your exact machine. We'll send you a proforma invoice with US product costs, Costa Rica customs clearance, and workshop installation options.",
    quoteStep1Title: "1. Configure Your Vehicle",
    quoteYearLabel: "Year",
    quoteSelectYear: "Select Year",
    quoteMakeLabel: "Make",
    quoteSelectMake: "Select Make",
    quoteModelLabel: "Model",
    quoteSelectModel: "Select Model",
    quoteStep2Title: "2. What type of quote do you need?",
    quoteInterestPackageTitle: "Stage Performance Package",
    quoteInterestPackageDesc: "Horsepower, ECU reflash, exhaust, belt, and clutch tuning.",
    quoteInterestPartsTitle: "Specific / Bolt-On Parts",
    quoteInterestPartsDesc: "A-arms, shocks, wheels, tires, roll cages, bumpers, or LED bars.",
    quoteInterestMaintenanceTitle: "Maintenance & OEM Parts",
    quoteInterestMaintenanceDesc: "Belts, filters, oils, ball joints, bushings, bearings, and brakes.",
    quoteInterestCustomTitle: "Custom US Special Order",
    quoteInterestCustomDesc: "You have a link or US part number you want imported.",
    quoteSpecificDetailsLabel: "Specific part details or links (Optional)",
    quoteSpecificDetailsPlaceholder: "Example: Looking for G-Boost belt and front tubular A-arms, or US store link...",
    quoteWorkshopIncludeLabel: "Include installation cost at ZxZ Workshop",
    quoteWorkshopWarrantyNotice: "60-day mechanical and 90-day bolt-on warranty",
    quoteWorkshopLocationBadge: "Santa Ana Workshop",
    quoteStep3Title: "3. Your Contact Details",
    quoteClientNameLabel: "Full Name",
    quoteClientNamePlaceholder: "Your name",
    quoteClientPhoneLabel: "Phone Number / WhatsApp",
    quoteClientPhonePlaceholder: "e.g. +1 555-0199 or 8888-9999",
    quoteImmediateResponseNotice: "Immediate technical response from certified advisors in Costa Rica",
    quoteSubmitWhatsappBtn: "Send Quote via WhatsApp",
    quoteAlertSelectVehicle: "Please select year, make, and model of your vehicle.",
    quoteAlertFillContact: "Please enter your name and phone number to process the quote.",

    // Documents Page (/documentos)
    docsOfficialPortalTitle: "Official ZxZ Mods Costa Rica S.A. Portal",
    docsWarranty60DaysTitle: "60 Days Labor Warranty",
    docsWarranty60DaysDesc: "Written warranty on assembly, torques, and calibrations in-shop and at home.",
    docsWarranty90DaysTitle: "90 Days Bolt-On Parts",
    docsWarranty90DaysDesc: "Protection against verified factory defects on mechanical components.",
    docsWarrantyEcuTitle: "Lifetime ECU File Warranty",
    docsWarrantyEcuDesc: "Permanent backup and free re-flashing if dealer updates computer software.",
    docsDocumentOfficialPrefix: "OFFICIAL DOCUMENT #",
    docsActiveLabel: "Effective:",
    docsJurisdictionLabel: "Jurisdiction:",
    docsJurisdictionValue: "Republic of Costa Rica (MEIC Laws & Commercial Code)",
    docsCorporateName: "ZxZ Mods Costa Rica S.A.",
    docsLegalIdNotice: "Registered Corporate ID • San José, Costa Rica",
    docsCloseModal: "Close",
    docsLastUpdated: "Last updated:",
    docsLoading: "Loading document...",
    docsDefaultTitle: "Legal Document",

    // Order Claim (/pedidos/reclamar/[token])
    claimInvalidLinkTitle: "Link Unavailable",
    claimInvalidLinkDesc: "This redemption link has already been used, has expired, or is invalid.",
    claimViewProfileBtn: "View My Profile & Orders",
    claimGoToStoreBtn: "Go to Store",
    claimSuccessTitle: "Order Claimed Successfully!",
    claimOrderLinkedBadge: "Linked",
    claimOrderSuccessDesc: "This order has been permanently registered to your account. You can track progress and parts status in your profile.",
    claimViewInMyAccountBtn: "View in My Account",
    claimSpecialQuoteHeader: "Order Claim / Special Quotation",
    claimOrderNumberPrefix: "Order #",
    claimOrderTotalLabel: "Quoted Total:",
    claimItemsListLabel: "Included Items Breakdown:",
    claimItemDefaultTitle: "Performance Part",

    // Installation Checkout (/pedidos/[id]/pagar-instalacion)
    instCheckoutHeader: "INSTALLATION CHECKOUT",
    instCheckoutSubtitle: "Installation & Labor Payment",
    instCheckoutDesc: "Pay only the installation and labor cost so the technical team can proceed with assembly.",
    instLaborSubtotal: "Net Labor Cost",
    instVatIncluded: "VAT (13% included)",
    instTotalAmount: "Installation Total (VAT inc.)",
    instBreakdownTitle: "Labor Breakdown",
    instOfficialAccountsTitle: "Official Bank Accounts (IBAN)",
    instOfficialAccountsSub: "Transfer the exact amount and upload your receipt below.",
    instUploadProofTitle: "Upload Labor Payment Receipt",
    instDropzonePrompt: "Click or drag your receipt here",
    instPhoneRequired: "Required Contact Phone",
    instPhoneBadgeRequired: "Required",
    instAlreadyConfirmed: "Installation Payment Already Confirmed",
    instUnderReview: "Receipt Under Review",
    instNotAvailableYet: "Installation Payment Not Available Yet",
    instMaxFileSizeError: "File exceeds the 100MB limit.",
    instUploadingProof: "Uploading Receipt...",
    instRegisteringPayment: "Registering Installation Payment...",
    instPaymentSuccess: "Installation Receipt Registered!",
    instVerifiedAccountsBadge: "Verified Accounts",

    // Home Page Sections
    homeNavigatingAdapted: "Browsing catalog tailored to your:",
    homeCostaRicaHq: "COSTA RICA HEADQUARTERS",
    homeHqSubtitle: "Santa Ana, San José • Specialized Installation",
    homeSpecializedBrandsTitle: "Specialized Platforms & Manufacturers",
    homeConfigureFullVehicle: "Configure Full Vehicle",
    homeModelsCountLabel: "Models",
    homePopularModelsLabel: "Popular Models:",
    homeCombosSectionSubtitle: "Ready-to-Install Kits & Packages",
    homeCombosNetPriceNotice: "Net prices in Costa Rican Colones",
    homePerformanceSectionSubtitle: "Horsepower Levels & Mechanical Tuning",
    homePerformanceMaxPower: "MAXIMUM HORSEPOWER",
    homeWorkshopSubtitle: "Professional Installation & Backing in Costa Rica",
    homeWorkshopPhysicalTitle: "PHYSICAL HEADQUARTERS & ZXZ WORKSHOP",
    homeWorkshopAddressLabel: "Address:",
    homeWorkshopPhoneLabel: "Phone:",
    homeProductShowcasePrevious: "Previous",
    homeProductShowcaseNext: "Next",
    homeProductShowcaseViewMore: "View More",

    // Catalog Pagination
    paginationShowing: "Showing",
    paginationOf: "of",
    paginationPrevious: "Previous",
    paginationNext: "Next",
    paginationPage: "Page",
  },

};

export function formatCRC(amount: number): string {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(amount).replace("CRC", "₡");
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function convertCRCToUSD(amountCRC: number, sellRate: number): number {
  if (!sellRate || sellRate <= 0) return 0;
  return Number((amountCRC / sellRate).toFixed(2));
}

export const categoryTranslations: Record<string, { es: string; en: string }> = {
  lights: { es: "Luces", en: "Lights" },
  electrical: { es: "Eléctrico", en: "Electrical" },
  "air & fuel": { es: "Aire & Combustible", en: "Air & Fuel" },
  air: { es: "Aire", en: "Air" },
  fuel: { es: "Combustible", en: "Fuel" },
  audio: { es: "Audio & Sonido", en: "Audio" },
  "skit plates": { es: "Placas Protectoras", en: "Skid Plates" },
  "skid plates": { es: "Placas Protectoras", en: "Skid Plates" },
  clutch: { es: "Clutch & Fajas", en: "Clutch & Belts" },
  drivetrain: { es: "Tren Motriz", en: "Drivetrain" },
  exhaust: { es: "Escapes", en: "Exhaust" },
  performance: { es: "Rendimiento", en: "Performance" },
  protection: { es: "Protección", en: "Protection" },
  recovery: { es: "Rescate & Winches", en: "Recovery & Winches" },
  suspension: { es: "Suspensión", en: "Suspension" },
  wheels: { es: "Aros & Llantas", en: "Wheels & Tires" },
  tires: { es: "Llantas", en: "Tires" },
  windshield: { es: "Parabrisas", en: "Windshields" },
  windshields: { es: "Parabrisas", en: "Windshields" },
  doors: { es: "Puertas", en: "Doors" },
  roof: { es: "Techos", en: "Roofs" },
  roofs: { es: "Techos", en: "Roofs" },
  bumpers: { es: "Defensas", en: "Bumpers" },
  cooling: { es: "Enfriamiento", en: "Cooling" },
  engine: { es: "Motor", en: "Engine" },
  accessories: { es: "Accesorios", en: "Accessories" },
  brakes: { es: "Frenos", en: "Brakes" },
};

export function getCategoryLabel(categoryKey: string, lang: Language = "es"): string {
  const normalized = categoryKey.toLowerCase().trim();
  const found = categoryTranslations[normalized];
  if (found) return found[lang];
  return categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
}

