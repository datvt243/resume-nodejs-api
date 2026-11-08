import {
  checkTextExtractable,
  checkReadingOrder,
  checkNoSpacedLetters,
  checkContactInBody,
  checkStandardHeadings,
  checkDateFormat,
  checkReverseChronological,
  checkNoForbiddenFields,
  checkPageCount,
  checkMetadata,
  scoreChecks,
  runAtsChecks,
  type AtsCheckInput,
} from '@/services/atsChecks';

const baseInput: AtsCheckInput = {
  text: 'Jane Doe\nSenior Backend Engineer\nHo Chi Minh City · 0901234567 · jane.doe@example.com\n\nSUMMARY\nSenior backend engineer.\n\nSKILLS\nLanguages: TypeScript\n\nEXPERIENCE\nSenior Backend Engineer — New Co\n09/2021 – Present\nLed the API team\n\nEDUCATION\nComputer Science — State University\n01/2015 – 01/2019',
  pages: 1,
  lang: 'en',
  fullName: 'Jane Doe',
  email: 'jane.doe@example.com',
  phone: '0901234567',
  sectionHeadings: ['Skills', 'Experience', 'Education'],
  experienceStartDates: [new Date(2021, 8, 1).getTime()],
  metadataTitle: 'Jane Doe - Senior Backend Engineer CV',
  metadataAuthor: 'Jane Doe',
};

describe('checkTextExtractable', () => {
  it('passes when enough text was extracted', () => {
    expect(checkTextExtractable(baseInput).passed).toBe(true);
  });

  it('fails when almost no text was extracted (likely an image-only PDF)', () => {
    expect(checkTextExtractable({ ...baseInput, text: 'Jane Doe' }).passed).toBe(false);
  });
});

describe('checkReadingOrder', () => {
  it('passes when the name is first and headings appear in order', () => {
    expect(checkReadingOrder(baseInput).passed).toBe(true);
  });

  it('fails when the name is not on the first line', () => {
    const input = { ...baseInput, text: `Senior Backend Engineer\n${baseInput.text}` };
    expect(checkReadingOrder(input).passed).toBe(false);
  });

  it('fails when headings appear out of order', () => {
    const input = { ...baseInput, sectionHeadings: ['Experience', 'Skills', 'Education'] };
    expect(checkReadingOrder(input).passed).toBe(false);
  });
});

describe('checkNoSpacedLetters', () => {
  it('passes for normal text', () => {
    expect(checkNoSpacedLetters(baseInput).passed).toBe(true);
  });

  it('fails when letters are separated by single spaces (letter-spacing artifact)', () => {
    const input = { ...baseInput, text: `${baseInput.text}\nF R O N T E N D` };
    expect(checkNoSpacedLetters(input).passed).toBe(false);
  });
});

describe('checkContactInBody', () => {
  it('passes when email and phone are both in the first ~10 lines', () => {
    expect(checkContactInBody(baseInput).passed).toBe(true);
  });

  it('fails when contact info is missing from the top of the body', () => {
    const input = { ...baseInput, text: 'Jane Doe\nSenior Backend Engineer\n\nSUMMARY\n...' };
    expect(checkContactInBody(input).passed).toBe(false);
  });
});

describe('checkStandardHeadings', () => {
  it('passes when every heading is a standard localized heading', () => {
    expect(checkStandardHeadings(baseInput).passed).toBe(true);
  });

  it('fails when a non-standard (e.g. legacy classic-template) heading is used', () => {
    const input = { ...baseInput, sectionHeadings: ['Skills', 'Định hướng nghề nghiệp'] };
    expect(checkStandardHeadings(input).passed).toBe(false);
  });
});

describe('checkDateFormat', () => {
  it('passes when all dates are zero-padded MM/YYYY', () => {
    expect(checkDateFormat(baseInput).passed).toBe(true);
  });

  it('fails on an unpadded single-digit month (the formatDate regression)', () => {
    const input = { ...baseInput, text: `${baseInput.text}\n9/2024` };
    expect(checkDateFormat(input).passed).toBe(false);
  });
});

describe('checkReverseChronological', () => {
  it('passes when experience start dates are descending', () => {
    const input = { ...baseInput, experienceStartDates: [new Date(2023, 0, 1).getTime(), new Date(2020, 0, 1).getTime()] };
    expect(checkReverseChronological(input).passed).toBe(true);
  });

  it('fails when an earlier job is listed before a later one', () => {
    const input = { ...baseInput, experienceStartDates: [new Date(2020, 0, 1).getTime(), new Date(2023, 0, 1).getTime()] };
    expect(checkReverseChronological(input).passed).toBe(false);
  });
});

describe('checkNoForbiddenFields', () => {
  it('passes when no forbidden personal field appears', () => {
    expect(checkNoForbiddenFields(baseInput).passed).toBe(true);
  });

  it('fails when date of birth is present', () => {
    const input = { ...baseInput, text: `${baseInput.text}\nDate of birth: 01/01/1990` };
    expect(checkNoForbiddenFields(input).passed).toBe(false);
  });

  it('fails when a Vietnamese forbidden field is present', () => {
    const input = { ...baseInput, text: `${baseInput.text}\nGiới tính: Nam` };
    expect(checkNoForbiddenFields(input).passed).toBe(false);
  });
});

describe('checkPageCount', () => {
  it('passes (warning-only) at 2 pages', () => {
    expect(checkPageCount({ ...baseInput, pages: 2 }).passed).toBe(true);
  });

  it('fails (warning) above 2 pages', () => {
    const result = checkPageCount({ ...baseInput, pages: 3 });
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('warning');
  });
});

describe('checkMetadata', () => {
  it('passes when Title and Author are set', () => {
    expect(checkMetadata(baseInput).passed).toBe(true);
  });

  it('fails when metadata is missing', () => {
    expect(checkMetadata({ ...baseInput, metadataTitle: undefined, metadataAuthor: undefined }).passed).toBe(false);
  });
});

describe('scoreChecks', () => {
  it('scores 100 when every check passes', () => {
    const checks = [
      { id: 'a', passed: true, severity: 'error' as const, message: '' },
      { id: 'b', passed: true, severity: 'warning' as const, message: '' },
    ];
    expect(scoreChecks(checks)).toBe(100);
  });

  it('weighs error failures more heavily than warning failures', () => {
    const errorFails = scoreChecks([
      { id: 'a', passed: false, severity: 'error' as const, message: '' },
      { id: 'b', passed: true, severity: 'warning' as const, message: '' },
    ]);
    const warningFails = scoreChecks([
      { id: 'a', passed: true, severity: 'error' as const, message: '' },
      { id: 'b', passed: false, severity: 'warning' as const, message: '' },
    ]);
    expect(errorFails).toBeLessThan(warningFails);
  });

  it('scores 0 when everything fails', () => {
    const checks = [{ id: 'a', passed: false, severity: 'error' as const, message: '' }];
    expect(scoreChecks(checks)).toBe(0);
  });
});

describe('template=classic', () => {
  const classic: AtsCheckInput = { ...baseInput, template: 'classic', sectionHeadings: [], metadataTitle: undefined, metadataAuthor: undefined };

  it('reports standard-headings and metadata as not applicable, with a localized message', () => {
    for (const check of [checkStandardHeadings(classic), checkMetadata(classic)]) {
      expect(check).toEqual(expect.objectContaining({ applicable: false, message: 'Not applicable to the classic template (it sets no PDF metadata and no standard section headings).' }));
    }
    expect(checkMetadata({ ...classic, lang: 'vi' }).message).toMatch(/^Không áp dụng cho mẫu classic/);
  });

  it('still judges both checks for the ats template', () => {
    expect(checkMetadata({ ...classic, template: 'ats' })).toEqual(expect.objectContaining({ passed: false }));
    expect(checkMetadata({ ...classic, template: 'ats' }).applicable).toBeUndefined();
  });

  it('leaves not-applicable checks out of the score', () => {
    const checks = runAtsChecks(classic);
    expect(checks).toHaveLength(10);
    const applicable = checks.filter((c) => c.applicable !== false);
    expect(applicable).toHaveLength(8);
    expect(scoreChecks(checks)).toBe(scoreChecks(applicable));
    expect(scoreChecks(checks)).toBe(100); // missing classic metadata no longer costs points
  });
});
