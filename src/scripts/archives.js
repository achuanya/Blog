import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

function getPostPath(id) {
  const blogId = id.split("/");
  const slug = blogId.length > 0 ? blogId.slice(-1)[0] : id;

  return `/${slug}/`;
}

function formatArchiveDate(dateString, tz) {
  if (!dateString) return { iso: '', date: '', time: '' };
  try {
    const datetime = dayjs(dateString).tz(tz || 'UTC');
    return {
      iso: datetime.toISOString(),
      date: datetime.format('MMM  D, YYYY'),
      time: datetime.format('hh:mm A'),
    };
  } catch (e) {
    return { iso: '', date: 'Invalid Date', time: '' };
  }
}

function createArchiveCardHTML(post, siteTimezone) {
  const defaultImageClass = "w-[55px] h-[55px] object-cover rounded-md group-hover:opacity-90 transition-opacity duration-300";

  let imgSrc = '';
  if (post.data.ogImage) {
    if (typeof post.data.ogImage === 'string') {
      imgSrc = post.data.ogImage;
    } else if (post.data.ogImage.src) {
      imgSrc = post.data.ogImage.src;
    }
  }

  const postPath = getPostPath(post.id);

  return `
    <li class="my-2 flex flex-row gap-6 items-start">
      <div class="flex-grow mx-auto my-auto">
        <a
          href="${postPath}"
          class="inline-block text-lg font-medium text-accent decoration-dashed underline-offset-4 focus-visible:no-underline focus-visible:underline-offset-0"
        >
          <h3 class="text-lg font-medium decoration-dashed hover:underline" style="view-transition-name: ${post.data.title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')}">${post.data.title}</h3>
        </a>
      </div>
    </li>
  `;
}

function createYearSectionHTML(year, yearGroup, siteTimezone) {
  let yearHTML = `
    <div class="year-section" data-year="${year}">
      <span class="text-2xl font-bold">${year}</span>
      <sup class="text-sm">${yearGroup.length}</sup>
      <div class="flex flex-col sm:flex-row">
        <div class="mt-6 min-w-36 text-lg sm:my-6">
          <!-- 保持原有的左侧空间以维持对齐 -->
        </div>
        <ul class="year-posts">
  `;

  // 直接按发布时间排序，不进行月份分组
  const sortedPosts = yearGroup.sort(
    (a, b) => new Date(b.data.pubDatetime).getTime() - new Date(a.data.pubDatetime).getTime()
  );

  sortedPosts.forEach(post => {
    yearHTML += createArchiveCardHTML(post, siteTimezone);
  });

  yearHTML += `
        </ul>
      </div>
    </div>
  `;
  return yearHTML;
}

export function initArchives(allPostsFromServer, siteTimezone, initialYearCount, yearsPerPage, enableLazyLoad = true) {
  const archivesContainer = document.getElementById('archives-container');
  const loadMoreTrigger = document.getElementById('load-more-trigger');

  if (!archivesContainer) {
    return;
  }

  const yearGroups = {};
  allPostsFromServer.forEach(post => {
    const year = new Date(post.data.pubDatetime).getFullYear();
    if (!yearGroups[year]) {
      yearGroups[year] = [];
    }
    yearGroups[year].push(post);
  });

  const sortedYears = Object.entries(yearGroups)
    .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA));

  let currentIndex = initialYearCount;

  function loadMoreYears() {
    if (!archivesContainer) {
      return;
    }

    const yearsToLoad = sortedYears.slice(currentIndex, currentIndex + yearsPerPage);

    if (yearsToLoad.length === 0 && loadMoreTrigger) {
      loadMoreTrigger.style.display = 'none';
      if (observer) {
        observer.disconnect();
      }
      return;
    }

    let newYearsHTML = '';
    yearsToLoad.forEach(([year, yearGroup]) => {
      newYearsHTML += createYearSectionHTML(year, yearGroup, siteTimezone);
    });

    archivesContainer.insertAdjacentHTML('beforeend', newYearsHTML);
    currentIndex += yearsToLoad.length;

    if (currentIndex >= sortedYears.length && loadMoreTrigger) {
      loadMoreTrigger.style.display = 'none';
      if (observer) {
        observer.disconnect();
      }
    }
  }

  let observer;
  if (loadMoreTrigger && sortedYears.length > initialYearCount && enableLazyLoad) {
    observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMoreYears();
      }
    }, { threshold: 0.1 });
    observer.observe(loadMoreTrigger);
  } else if (loadMoreTrigger) {
    loadMoreTrigger.style.display = 'none';
  }
}