import puppeteer from 'puppeteer';
// import open from 'open';

import { Response } from 'express';
import { informationPersonal, Skill, Item, Language, Reference, Certificate, Award } from '@/types/candidate.type';

export const createCV = async (data: Record<string, any>, res: Response) => {
  try {
    const URL = `src/public/pdf/`;

    // Optional override for CI/Docker where a specific Chrome/Chromium must be pinned.
    // Unset: puppeteer resolves its own bundled Chromium automatically.
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

    const otp = {
      ...(executablePath ? { executablePath } : {}),
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    };
    const browser = await puppeteer.launch(otp);
    const page = await browser.newPage();

    const { email, html: contentHTML } = pageRender(data);

    /* res.send(contentHTML); */

    await page.setContent(contentHTML, {
      waitUntil: 'domcontentloaded',
    });

    const mm = '5mm';
    const pdfBuffer = await page.pdf({
      path: `${URL}${email}.pdf`,
      format: 'A4',
      margin: {
        top: mm,
        right: mm,
        bottom: mm,
        left: mm,
      },
    });

    // Open the generated PDF file in the default PDF viewer

    // try {
    //     await (async () => {
    //         const open: any = await import('open');
    //         await open(`${URL}${email}.pdf`, { wait: true });
    //     })();
    //
    // } catch (e) {
    //     console.log({ e })
    // }

    // Close the browser
    await browser.close();

    res.contentType('application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).send({
      status: false,
      message: 'Xảy ra lỗi, không thể đọc browser',
      error: error,
    });
  }
};

export const pageRender = (RECORD: Record<string, any>) => {
  /**
   * get data format
   */
  const {
    candidate,
    generalInformation,
    educations,
    experiences,
    projects,
    references = [],
    certificates = [],
    awards = [],
  } = getDataCandidate(RECORD);

  /**
   * render HTML
   */
  let _content = '';
  const _ = _helper();

  _content += _.renderInfo(candidate);
  _content += _.renderCareer(generalInformation);
  _content += _.renderSkills(generalInformation);
  _content += _.renderExperience(experiences);
  _content += _.renderProject(projects);
  _content += _.renderEducation(educations);
  _content += _.renderAwards(awards);
  _content += _.renderCertificates(certificates);
  _content += _.renderForeignLanguages(generalInformation?.foreignLanguages || []);
  _content += _.renderReferences(references);

  const html = getHTMLLayout(_content);
  return {
    email: candidate?.email || 'resume',
    html,
  };
  /* res.send(html); */
};

/**
 * format data
 * @param {*} RECORD
 * @returns
 */
const getDataCandidate = (RECORD: Record<string, any>) => {
  // Thông tin cơ bản
  const candidate = (() => {
    const { firstName, lastName, phone, email, address, introduction, socialMedia = {} } = RECORD;
    const { github = '', linkedin = '', website = '' } = socialMedia;
    return {
      firstName,
      lastName,
      phone,
      email,
      address,
      introduction,
      github,
      linkedin,
      website,
    };
  })();

  // Thông tin công việc
  const generalInformation = ((el) => {
    if (!el) return {};
    return Array.isArray(el) ? el?.[0] || {} : el;
  })(RECORD?.generalInformation || null);

  // ---
  const { educations, experiences, projects, references = [], certificates = [], awards = [] } = RECORD;

  return {
    candidate,
    generalInformation,
    educations,
    experiences,
    projects,
    references,
    certificates,
    awards,
  };
};

const _helper = () => {
  const _layoutItem = (props: Item) => {
    const { title, subTitle, startDate, endDate, isCurrent, description, skills = [] } = props;

    const formatDate = (val: number | null) => {
      if (!val) return '';
      const date = new Date(val);
      let m = date.getMonth() + 1,
        y = date.getFullYear();
      return `${m < 9 ? `0${m}` : m}/${y}`;
    };

    const getTime = ((startDate, endDate, isCurrent) => {
      const _start = formatDate(startDate);
      if (!endDate) {
        return _start;
      }

      const _end = isCurrent ? 'Hiện tại' : formatDate(endDate);
      return `${_start} - ${_end}`;
    })(startDate, endDate, isCurrent);

    const getSkills = ((skills = []) => {
      return !skills.length ? `<div class="skills">${skills.join(', ')}</div>` : '';
    })();
    return `
            <div class="item">
                <div class="header">
                    <div class="d-flex between bg-gray mb-0">
                        <div class="title">${title}</div>
                        <div class="time">${getTime}</div>
                    </div>
                </div>
                <div class="body">
                    <p class="sub-title">${subTitle}</p>
                    <div class="description"> 
                        ${description}
                    </div>
                    ${getSkills}
                </div>
            </div>
        `;
  };
  const _boxContent = (title = '', content = '') => {
    return `
            <div class="box">
                <div class="heading">${title.toUpperCase()}</div>
                <div class="clear" style="padding-left: 1rem">
                    ${content}
                </div>
            </div>
        `;
  };
  return {
    renderInfo: function (props: informationPersonal) {
      const { firstName, lastName, phone, email, address, introduction, github, linkedin, website } = props;

      const getInfo = (phone: string, email: string, address: string) => {
        let _result = '';
        address && (_result += address);
        email && (_result += ` - <a href="mailto:${email}">${email}</a>`);
        phone && (_result += ` - <a href="tel:${phone}">${phone}</a>`);
        return _result;
      };
      const getWebsite = (github: string = '', linkedin: string = '', website: string = '') => {
        let _result = '';
        github && (_result += `<a href="${github}">${github}</a>`);
        linkedin && (_result += ` - <a href="${linkedin}">${linkedin}</a>`);
        website && (_result += ` - <a href="${website}">${website}</a>`);
        return _result;
      };

      return `
                <div class="box">
                    <div class="text-center" style="margin-bottom: 10px">
                        <div class="full-name">${firstName} ${lastName}</div>
                        <div class="info mb-0">${getInfo(phone, email, address)}</div>
                        <div class="website">${getWebsite(github, linkedin, website)}</div>
                    </div>
                    <div class="description">${introduction}</div>
                </div>`;
    },
    renderCareer: function (generalInformation: { career?: string; careerGoal?: string }) {
      // `career`/`careerGoal` are localized ({vi,en}) fields at the model
      // level, but by the time they reach here they've already been
      // resolved to a single string upstream (candidate_me/index.ts's
      // resolveLocalizedText) — same as every other field this function
      // handles.
      const { career = '', careerGoal = '' } = generalInformation || {};
      if (!career && !careerGoal) return '';

      let _result = '';
      career && (_result += `<p><strong>Nghề nghiệp:</strong> ${career}</p>`);
      careerGoal && (_result += `<p><strong>Mục tiêu nghề nghiệp:</strong> ${careerGoal}</p>`);

      return _boxContent('Định hướng nghề nghiệp', _result);
    },
    renderSkills: function (generalInformation: {
      personalSkills: Skill[];
      professionalSkills: Skill[];
      professionalSkillsGroup: string[];
    }) {
      function getContent(title = '', skills: Skill[] = []) {
        if (!skills.length) return '';
        return `<li>${title}: ${skills.map((e) => e.name).join(', ')}</li>`;
      }
      function getProfessionalSkills(skills: Skill[], groups: string[]) {
        if (!groups.length) return getContent('Kỹ năng chuyên môn', skills);

        if (skills.filter((i) => i.group).length) {
          const _groups: { name: string; skills: Skill[] | [] }[] = [];
          for (const gr of groups) {
            _groups.push({ name: gr, skills: skills.filter((i) => i.group === gr) });
          }

          _groups.push({ name: 'other', skills: skills.filter((i) => !i.group) });

          let str = '';
          for (const { name, skills } of _groups) {
            skills.length && (str += `<li>${name}: ${skills.map((i) => i.name).join(', ')}</li>`);
          }

          return str;
        }
        return getContent('Kỹ năng chuyên môn', skills);
      }
      const { personalSkills = [], professionalSkills = [], professionalSkillsGroup = [] } = generalInformation;

      if (!personalSkills.length && !professionalSkills.length) return '';

      return _boxContent(
        'Kỹ năng',
        `<ul class="list" style="padding-left: 2.5rem">
                    ${getProfessionalSkills(professionalSkills, professionalSkillsGroup)}
                </ul>
                <ul class="list">
                    ${getContent('Kỹ năng cá nhân', personalSkills)}
                </ul>`,
      );
    },
    renderEducation: function (list = []) {
      if (!list.length) return '';

      const _content = list
        .map((el) => {
          const { school: subTitle, major: title, startDate, endDate, description, isCurrent } = el;
          return _layoutItem({ title, subTitle: `Trường: ${subTitle}`, startDate, endDate, isCurrent, description });
        })
        .join('');

      return _boxContent('Học vấn', _content);
    },
    renderExperience: function (list = []) {
      if (!list.length) return '';

      const _content = list
        .map((el) => {
          const { company: subTitle, position: title, startDate, endDate, description, isCurrent, skills } = el;
          return _layoutItem({
            title,
            subTitle: `${subTitle}`,
            startDate,
            endDate,
            isCurrent,
            description,
            skills,
          });
        })
        .join('');

      return _boxContent('Kinh nghiệm làm việc', _content);
    },
    renderProject: function (list = []) {
      if (!list.length) return '';

      const _content = list
        .map((el) => {
          const {
            name: title,
            position: subTitle,
            startDate,
            endDate,
            description,
            isWorking: isCurrent,
            technology: skills,
          } = el;
          return _layoutItem({
            title,
            subTitle: `${subTitle}`,
            startDate,
            endDate,
            isCurrent,
            description,
            skills,
          });
        })
        .join('');

      return _boxContent('Dự Án', _content);
    },
    renderForeignLanguages: function (list: Language[] = []) {
      if (!list.length) return '';
      return _boxContent(
        'Ngoại ngữ',
        `<ul style="display: flex-inline-block">
                    ${list
                      .map((el) => {
                        return `
                                <li style="padding-right: 20px; text-transform: capitalize">
                                    ${el.language} (${el.level})
                                </li>`;
                      })
                      .join('')}
                </ul>`,
      );
    },
    renderReferences: function (list: Reference[]) {
      if (!list.length) return '';
      return _boxContent(
        'Người tham khảo',
        `<ul class="d-flex">
                    ${list
                      .map((e: Reference) => {
                        return `
                                <li class="col-6">
                                    <p>${e.fullName.toLocaleUpperCase()}</p>
                                    <p>Công ty: ${e.company}</p>
                                    <p>Chức vụ: ${e.position}</p>
                                    <p>Tel: ${e.phone} </p>
                                </li>
                            `;
                      })
                      .join('')}
                </ul>`,
      );
    },
    renderCertificates: function (list: Certificate[]) {
      if (!list.length) return '';

      const _content = list
        .map((el: Certificate) => {
          const {
            organization: subTitle,
            name: title,
            startDate,
            endDate = +new Date(),
            description = '',
            isNoExpiration: isCurrent,
          } = el;
          return _layoutItem({ title, subTitle: `Nơi cấp: ${subTitle}`, startDate, endDate, isCurrent, description });
        })
        .join('');

      return _boxContent('Chứng chỉ', _content);
    },
    renderAwards: function (list: Award[]) {
      if (!list.length) return '';

      const _content = list
        .map((el: Award) => {
          const { organization: subTitle, name: title, issueDate: startDate, description = '' } = el;
          return _layoutItem({
            title,
            subTitle: `Đơn vị: ${subTitle}`,
            startDate,
            endDate: null,
            isCurrent: false,
            description,
          });
        })
        .join('');

      return _boxContent('Giải thưởng', _content);
    },
  };
};

const getHTMLLayout = (content = '') => {
  const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                <meta name="description"/>
                <meta name="keywords"/>
                <link rel="icon" href="/>
                <title>Download CV</title>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css"/>
                <link rel="preconnect" href="https://fonts.googleapis.com"/>
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="crossorigin"/>
                <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
                ${getStyles()}
            </head>
            <body>
                <div class="container" style="padding: 5px">
                ${content}
                </div>
            </body>
        </html>
    `;
  function getStyles() {
    return `
            <style>
                html { font-size: 9px; font-family: 'Barlow' }
                body { font-size: 1.4rem }
                * {
                    line-height: 1.25;
                    margin: 0 0 .5rem 0;
                    padding: 0
                    
                }
                p {  margin-bottom: .5rem }
                .full-name {
                    font-size: 2.4rem;
                    text-transform: uppercase;
                    font-weight: bold;
                    letter-spacing: .25em;
                }
                .text-center { text-align: center }

                .box { margin-bottom: 1.25rem }

                .heading {
                    font-size: 1.8rem;
                    text-transform: uppercase;
                    font-weight: bold;
                    letter-spacing: .25em;
                    border-bottom: .2rem solid;
                    margin-bottom: 1rem
                }
                .d-flex { display: flex; }
                .d-flex.between { justify-content: space-between; }
                .d-flex > .col-6 { flex-basis: 50% }

                .bg-gray { background-color: #f5f5f5; }
                
                .item:not(:last-child) { margin-bottom: 1rem }
                .item .bg-gray { padding: 0 }
                .item .bg-gray > * { margin-bottom: 0 }

                .item .header {
                    margin-bottom: .25rem
                }
                .item .header > * {
                    margin-bottom: 0
                }
                .item .body {
                    padding-left: 1rem
                }
                .item .title {
                    font-weight: bold;
                    font-size: 1.5rem;
                    text-transform: uppercase;
                    letter-spacing: .18em;
                }
                .item .time {
                    font-size: .8em
                }
                .item .sub-title {
                    font-style: italic;
                    letter-spacing: .06em;
                }
                .mb-0 { margin-bottom: 0 !important }

                ul, ol {
                    padding-left: 1.2em;
                }
                ul > li, ol > li {
                    margin: 0 0 5px 0;
                }
                ul { list-style: disc; }
                ol { list-style: circle; }
                
                .col-6 { flex-basic: 50% }
            </style>
        `;
  }
  return htmlContent;
};
