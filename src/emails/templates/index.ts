
import { template as certificateNotification } from './certificate-notification';
import { template as contactAdminNotification } from './contact-admin-notification';
import { template as contactUserConfirmation } from './contact-user-confirmation';
import { template as enrollmentAdminNotification } from './enrollment-admin-notification';
import { template as enrollmentUserConfirmation } from './enrollment-user-confirmation';
import { template as licensePrintAdminNotification } from './license-print-admin-notification';
import { template as licensePrintStatusUpdate } from './license-print-status-update';
import { template as llInquiryAdminNotification } from './ll-inquiry-admin-notification';
import { template as llInquiryStatusUpdate } from './ll-inquiry-status-update';
import { template as refresherAdminNotification } from './refresher-admin-notification';
import { template as refresherUserConfirmation } from './refresher-user-confirmation';
import { template as refresherStatusUpdate } from './refresher-status-update';
import { template as userDataExport } from './user-data-export';

export const templates = {
  'certificate-notification': certificateNotification,
  'contact-admin-notification': contactAdminNotification,
  'contact-user-confirmation': contactUserConfirmation,
  'enrollment-admin-notification': enrollmentAdminNotification,
  'enrollment-user-confirmation': enrollmentUserConfirmation,
  'license-print-admin-notification': licensePrintAdminNotification,
  'license-print-status-update': licensePrintStatusUpdate,
  'll-inquiry-admin-notification': llInquiryAdminNotification,
  'll-inquiry-status-update': llInquiryStatusUpdate,
  'refresher-admin-notification': refresherAdminNotification,
  'refresher-user-confirmation': refresherUserConfirmation,
  'refresher-status-update': refresherStatusUpdate,
  'user-data-export': userDataExport,
};
