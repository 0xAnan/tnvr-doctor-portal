export function classifyCloudWriteError(error) {
  const signature = `${error?.code || ''} ${error?.message || ''}`.toLowerCase();

  if (
    signature.includes('permission_denied') ||
    signature.includes('permission-denied') ||
    signature.includes('permission denied')
  ) {
    return {
      code: 'permission-denied',
      retryable: false,
      message: 'Firebase رفض الحفظ. تحقق من نشر قواعد Realtime Database، صلاحية الحساب، وحالة الحصة المجانية.'
    };
  }

  if (
    signature.includes('quota_exceeded') ||
    signature.includes('quota-exceeded') ||
    signature.includes('quota exceeded') ||
    signature.includes('resource_exhausted')
  ) {
    return {
      code: 'quota-exceeded',
      retryable: false,
      message: 'تجاوز مشروع Firebase الحد المجاني. لن يقبل بيانات جديدة حتى إعادة ضبط الحصة أو ترقية الخطة.'
    };
  }

  if (
    signature.includes('payload') &&
    (signature.includes('large') || signature.includes('size'))
  ) {
    return {
      code: 'payload-too-large',
      retryable: false,
      message: 'حجم الصور كبير جداً للحفظ. احذف بعض الصور أو ارفعها على دفعات أصغر.'
    };
  }

  if (
    signature.includes('timed out') ||
    signature.includes('network') ||
    signature.includes('disconnected') ||
    signature.includes('unavailable')
  ) {
    return {
      code: 'network-unavailable',
      retryable: true,
      message: 'تعذر الوصول إلى Firebase. حُفظت العملية على هذا الجهاز وستتم مزامنتها عند عودة الاتصال.'
    };
  }

  return {
    code: 'unknown',
    retryable: false,
    message: 'فشل حفظ البيانات في Firebase. لم تُغلق النافذة حتى لا تفقد البيانات المدخلة.'
  };
}
