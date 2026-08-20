(function () {
  var clockFormatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  var dateFormatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });

  var timeEl = document.getElementById("jst-time");
  var dateEl = document.getElementById("jst-date");


  var renderClock = function () {
    var now = new Date();
    if (timeEl) {
      timeEl.textContent = clockFormatter.format(now);
    }
    if (dateEl) {
      dateEl.textContent = dateFormatter.format(now);
    }
  };

  renderClock();
  window.setInterval(renderClock, 1000);

  var siteHeader = document.querySelector(".site-header");
  if (siteHeader) {
    var updateHeaderScrollState = function () {
      siteHeader.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    updateHeaderScrollState();
    window.addEventListener("scroll", updateHeaderScrollState, { passive: true });
  }

  var rulerTop = document.getElementById("ruler-top");
  var rulerLeft = document.getElementById("ruler-left");
  if (rulerTop && rulerLeft) {
    var buildRulerLabels = function (el, axis) {
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }

      var span = axis === "x" ? window.innerWidth : window.innerHeight;
      for (var i = 0; i <= span; i += 100) {
        var label = document.createElement("span");
        label.className = "ruler-label";
        label.textContent = String(i);
        if (axis === "x") {
          label.style.left = i + "px";
          label.style.top = "2px";
        } else {
          label.style.top = i + "px";
          label.style.left = "2px";
        }
        el.appendChild(label);
      }
    };

    var renderRulers = function () {
      buildRulerLabels(rulerTop, "x");
      buildRulerLabels(rulerLeft, "y");
    };

    renderRulers();
    window.addEventListener("resize", renderRulers, { passive: true });
  }


  var introEl = document.getElementById("intro");
  if (introEl) {
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var introText = introEl.querySelector(".intro-text");
    var introWord = document.getElementById("intro-word");
    var root = document.body;
    var introTimers = [];
    var introFinished = false;

    root.classList.add("intro-active");

    var schedule = function (fn, delay) {
      var timerId = window.setTimeout(fn, delay);
      introTimers.push(timerId);
      return timerId;
    };

    var beginOutro = function () {
      if (!introEl || introEl.classList.contains("is-done")) {
        return;
      }
      root.classList.remove("intro-active");
      root.classList.add("intro-done");
      introEl.classList.add("is-done");
    };

    var finishIntro = function () {
      if (introFinished) {
        return;
      }
      introFinished = true;
      introTimers.forEach(function (timerId) {
        window.clearTimeout(timerId);
      });
      root.classList.remove("intro-active");
      root.classList.add("intro-done");
      if (introEl && introEl.parentNode) {
        introEl.parentNode.removeChild(introEl);
      }
    };

    if (reducedMotion) {
      finishIntro();
    } else {
      if (introWord) {
        introWord.textContent = "";
      }

      schedule(function () {
        if (introWord) { introWord.textContent = "o"; }
      }, 140);

      schedule(function () {
        if (introWord) { introWord.textContent = "on"; }
      }, 280);

      schedule(function () {
        if (introWord) { introWord.textContent = "ond"; }
      }, 420);

      schedule(function () {
        if (introWord) { introWord.textContent = "ondo"; }
      }, 560);

      schedule(function () {
        if (introText) { introText.classList.add("is-selected"); }
      }, 910);

      schedule(function () {
        if (introWord) { introWord.textContent = ""; }
      }, 1160);

      schedule(function () {
        beginOutro();
      }, 1460);

      schedule(function () {
        finishIntro();
      }, 2060);

      schedule(function () {
        finishIntro();
      }, 2800);
    }
  }

  var statusBar = document.getElementById("status-bar");
  var setStatus = function (text, activeMs) {
    if (!statusBar) {
      return;
    }

    statusBar.textContent = text;
    if (!activeMs) {
      return;
    }

    statusBar.classList.add("is-active");
    window.clearTimeout(setStatus._timer);
    setStatus._timer = window.setTimeout(function () {
      statusBar.classList.remove("is-active");
    }, activeMs);
  };

  var movieTabsRoot = document.querySelector("[data-movie-tabs]");
  if (movieTabsRoot) {
    var movieTabs = Array.prototype.slice.call(movieTabsRoot.querySelectorAll("[data-year-tab]"));
    var moviePanels = Array.prototype.slice.call(movieTabsRoot.querySelectorAll("[data-year-panel]"));

    var setMovieYear = function (year) {
      movieTabs.forEach(function (tab) {
        var selected = tab.getAttribute("data-year-tab") === year;
        tab.classList.toggle("is-active", selected);
        tab.setAttribute("aria-selected", selected ? "true" : "false");
      });

      moviePanels.forEach(function (panel) {
        var active = panel.getAttribute("data-year-panel") === year;
        if (active) {
          panel.removeAttribute("hidden");
        } else {
          panel.setAttribute("hidden", "hidden");
        }
      });
    };

    movieTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        setMovieYear(tab.getAttribute("data-year-tab"));
      });
    });

    var initialTab = movieTabs.find(function (tab) {
      return tab.classList.contains("is-active");
    }) || movieTabs[0];

    if (initialTab) {
      setMovieYear(initialTab.getAttribute("data-year-tab"));
    }
  }

  var movieYearTitles = Array.prototype.slice.call(document.querySelectorAll("body.page-movie .movie-year-title[data-year]"));
  if (movieYearTitles.length) {
    var movieReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var movieFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (!movieReduceMotion && movieFinePointer) {
      var movieTicking = false;
      var updateMovieYearParallax = function () {
        var scrollY = window.scrollY || window.pageYOffset || 0;
        movieYearTitles.forEach(function (title, index) {
          var shift = Math.max(-24, Math.min(24, scrollY * 0.16 + (index * 1.5)));
          title.style.setProperty("--movie-year-shift", shift.toFixed(2) + "px");
        });
        movieTicking = false;
      };

      var onMovieScroll = function () {
        if (movieTicking) {
          return;
        }
        movieTicking = true;
        window.requestAnimationFrame(updateMovieYearParallax);
      };

      updateMovieYearParallax();
      window.addEventListener("scroll", onMovieScroll, { passive: true });
      window.addEventListener("resize", onMovieScroll, { passive: true });
    }
  }

  var shareButtons = Array.prototype.slice.call(document.querySelectorAll("[data-web-share]"));
  shareButtons.forEach(function (button) {
    if (!navigator.share) {
      button.hidden = true;
      return;
    }

    button.hidden = false;
    button.addEventListener("click", function () {
      var title = button.getAttribute("data-share-title") || document.title;
      var url = button.getAttribute("data-share-url") || window.location.href;
      navigator.share({ title: title, url: url }).catch(function (err) {
        if (err && err.name === "AbortError") {
          return;
        }
      });
    });
  });

  var copyBtn = document.querySelector("[data-copy-email]");
  if (copyBtn) {
    var copyStatusId = copyBtn.getAttribute("data-copy-target");
    var copyStatus = copyStatusId ? document.getElementById(copyStatusId) : null;

    var showCopyStatus = function (text) {
      if (!copyStatus) {
        return;
      }
      copyStatus.textContent = text;
      window.clearTimeout(showCopyStatus._timer);
      showCopyStatus._timer = window.setTimeout(function () {
        copyStatus.textContent = "";
      }, 2000);
    };

    var fallbackCopy = function (text) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (e) {
        ok = false;
      }
      document.body.removeChild(ta);
      return ok;
    };

    copyBtn.addEventListener("click", function () {
      var text = copyBtn.getAttribute("data-copy-text") || "";
      if (!text) {
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          showCopyStatus("copied");
        }).catch(function () {
          showCopyStatus(fallbackCopy(text) ? "copied" : "failed");
        });
      } else {
        showCopyStatus(fallbackCopy(text) ? "copied" : "failed");
      }
    });
  }

  var blogFilterRoot = document.querySelector("[data-blog-filter-root]");

(function(){
  var discDetails = Array.prototype.slice.call(document.querySelectorAll("body.page-discography details.disc-year-row--details"));
  if (!discDetails.length) return;

  var booting = true;

  discDetails.forEach(function (detail) {
    detail.open = false;

    var summary = detail.querySelector("summary");
    if (summary) {
      summary.addEventListener("click", function () {
        detail.dataset.userToggleTs = String(Date.now());
      });
    }

    detail.addEventListener("toggle", function () {
      if (booting) {
        return;
      }

      var ts = Number(detail.dataset.userToggleTs || 0);
      var userInitiated = Date.now() - ts < 700;

      if (!detail.open && !userInitiated) {
        detail.open = true;
      }
    });
  });

  booting = false;
})();
  if (blogFilterRoot) {
    var filterButtons = Array.prototype.slice.call(blogFilterRoot.querySelectorAll("[data-blog-filter]"));
    var filterItems = Array.prototype.slice.call(blogFilterRoot.querySelectorAll("[data-blog-item]"));

    var applyBlogFilter = function (tag) {
      filterButtons.forEach(function (btn) {
        var active = btn.getAttribute("data-blog-filter") === tag;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });

      filterItems.forEach(function (item) {
        if (tag === "all") {
          item.hidden = false;
          return;
        }

        var rawTags = item.getAttribute("data-tags") || "";
        var tags = rawTags.split(",").map(function (v) {
          return v.trim();
        }).filter(Boolean);

        item.hidden = tags.indexOf(tag) === -1;
      });

      var yearSections = Array.prototype.slice.call(blogFilterRoot.querySelectorAll(".blog-year"));
      yearSections.forEach(function (section) {
        var visibleInSection = Array.prototype.slice.call(section.querySelectorAll("[data-blog-item]")).some(function (item) {
          return !item.hidden;
        });
        section.hidden = !visibleInSection;
      });
    };

    filterButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyBlogFilter(btn.getAttribute("data-blog-filter") || "all");
      });
    });

    var params = new URLSearchParams(window.location.search);
    var initialTag = params.get("tag") || "all";
    var allowed = ["all"].concat(filterButtons.map(function (btn) {
      return btn.getAttribute("data-blog-filter") || "";
    }));
    if (allowed.indexOf(initialTag) === -1) {
      initialTag = "all";
    }

    applyBlogFilter(initialTag);
  }

  var artistButton = document.getElementById("artist-button");
  var profileMenuToggle = document.getElementById("profile-menu-toggle");
  var arcMenu = document.getElementById("arc-menu");
  var menuTrigger = artistButton || profileMenuToggle;
  if (!menuTrigger || !arcMenu) {
    return;
  }

  var root = document.body;
  var selectionHandles = Array.prototype.slice.call(document.querySelectorAll(".selection-handle"));
  var reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  var pointerEnabled = !reducedMotionQuery.matches && finePointerQuery.matches;
  var homeHoverMenuEnabled = !!artistButton && root.classList.contains("is-home") && finePointerQuery.matches;

  var pointerX = window.innerWidth * 0.5;
  var pointerY = window.innerHeight * 0.5;
  var targetRulerX = 0;
  var targetRulerY = 0;
  var currentRulerX = 0;
  var currentRulerY = 0;
  var rafId = 0;

  var handleTargets = selectionHandles.map(function () {
    return { x: 0, y: 0 };
  });
  var handleCurrent = selectionHandles.map(function () {
    return { x: 0, y: 0 };
  });

  var clamp = function (value, min, max) {
    return Math.max(min, Math.min(max, value));
  };

  var applyHandleOffsets = function () {
    selectionHandles.forEach(function (handle, index) {
      handle.style.setProperty("--handle-tx", handleCurrent[index].x.toFixed(2) + "px");
      handle.style.setProperty("--handle-ty", handleCurrent[index].y.toFixed(2) + "px");
    });
  };

  var computeHandleTargets = function () {
    if (!root.classList.contains("menu-open")) {
      handleTargets.forEach(function (target) {
        target.x = 0;
        target.y = 0;
      });
      return;
    }

    var influenceRadius = 170;
    var maxShift = 6;

    selectionHandles.forEach(function (handle, index) {
      var rect = handle.getBoundingClientRect();
      var cx = rect.left + rect.width * 0.5;
      var cy = rect.top + rect.height * 0.5;
      var dx = cx - pointerX;
      var dy = cy - pointerY;
      var dist = Math.hypot(dx, dy) || 1;

      if (dist >= influenceRadius) {
        handleTargets[index].x = 0;
        handleTargets[index].y = 0;
        return;
      }

      var force = (1 - dist / influenceRadius);
      var jitter = 0.88 + (index * 0.06);
      var nx = dx / dist;
      var ny = dy / dist;
      handleTargets[index].x = clamp(nx * maxShift * force * jitter, -maxShift, maxShift);
      handleTargets[index].y = clamp(ny * maxShift * force * jitter, -maxShift, maxShift);
    });
  };

  var applyRulerOffsets = function () {
    var majorX = clamp(currentRulerX * 0.55, -12, 12);
    var majorY = clamp(currentRulerY * 0.55, -12, 12);
    var minorX = majorX * 0.42;
    var minorY = majorY * 0.42;

    if (rulerTop) {
      rulerTop.style.backgroundPosition = minorX.toFixed(2) + "px 0px, " + majorX.toFixed(2) + "px 0px";
    }

    if (rulerLeft) {
      rulerLeft.style.backgroundPosition = "0px " + minorY.toFixed(2) + "px, 0px " + majorY.toFixed(2) + "px";
    }
  };

  var resetInteractiveMotion = function () {
    targetRulerX = 0;
    targetRulerY = 0;
    handleTargets.forEach(function (target) {
      target.x = 0;
      target.y = 0;
    });
  };

  var clearInteractiveStyles = function () {
    if (rulerTop) {
      rulerTop.style.backgroundPosition = "";
    }
    if (rulerLeft) {
      rulerLeft.style.backgroundPosition = "";
    }

    selectionHandles.forEach(function (handle) {
      handle.style.removeProperty("--handle-tx");
      handle.style.removeProperty("--handle-ty");
    });

    root.classList.remove("parallax-active");
  };

  var frame = function () {
    currentRulerX += (targetRulerX - currentRulerX) * 0.14;
    currentRulerY += (targetRulerY - currentRulerY) * 0.14;

    var handleActive = false;
    handleCurrent.forEach(function (current, index) {
      current.x += (handleTargets[index].x - current.x) * 0.16;
      current.y += (handleTargets[index].y - current.y) * 0.16;
      if (Math.abs(current.x) > 0.03 || Math.abs(current.y) > 0.03) {
        handleActive = true;
      }
    });

    applyRulerOffsets();
    applyHandleOffsets();

    var rulerSettled = Math.abs(targetRulerX - currentRulerX) < 0.05 && Math.abs(targetRulerY - currentRulerY) < 0.05;
    var shouldStop = !root.classList.contains("menu-open") && rulerSettled && !handleActive;

    if (shouldStop) {
      currentRulerX = 0;
      currentRulerY = 0;
      rafId = 0;
      clearInteractiveStyles();
      return;
    }

    rafId = window.requestAnimationFrame(frame);
  };

  var ensureFrame = function () {
    if (rafId) {
      return;
    }
    rafId = window.requestAnimationFrame(frame);
  };

  var handlePointerMove = function (event) {
    if (!pointerEnabled || !root.classList.contains("menu-open")) {
      return;
    }

    pointerX = event.clientX;
    pointerY = event.clientY;

    var centerX = window.innerWidth * 0.5;
    var centerY = window.innerHeight * 0.5;
    targetRulerX = clamp((pointerX - centerX) * 0.12, -12, 12);
    targetRulerY = clamp((pointerY - centerY) * 0.12, -12, 12);

    computeHandleTargets();
    root.classList.add("parallax-active");
    ensureFrame();
  };

  var handlePointerLeave = function () {
    if (!pointerEnabled || !root.classList.contains("menu-open")) {
      return;
    }
    pointerX = window.innerWidth * 0.5;
    pointerY = window.innerHeight * 0.5;
    resetInteractiveMotion();
    ensureFrame();
  };

  if (pointerEnabled) {
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave, { passive: true });
  }

  var setMenuOpen = function (open, skipStatus) {
    arcMenu.classList.toggle("open", open);
    if (artistButton) {
      artistButton.setAttribute("aria-expanded", open ? "true" : "false");
    }
    if (profileMenuToggle) {
      profileMenuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    }
    root.classList.toggle("menu-open", open);

    if (!pointerEnabled) {
      clearInteractiveStyles();
    } else if (open) {
      root.classList.add("parallax-active");
      pointerX = window.innerWidth * 0.5;
      pointerY = window.innerHeight * 0.5;
      resetInteractiveMotion();
      ensureFrame();
    } else {
      resetInteractiveMotion();
      ensureFrame();
    }

    if (!skipStatus) {
      setStatus(open ? "STATUS: NAV OPEN" : "STATUS: NAV CLOSED", 500);
    }
  };

  setMenuOpen(false, true);
  setStatus("STATUS: IDLE / NAV: CLOSED");

  if (homeHoverMenuEnabled) {
    artistButton.addEventListener("pointerenter", function () {
      if (!arcMenu.classList.contains("open")) {
        setMenuOpen(true);
      }
    });
  }

  menuTrigger.addEventListener("click", function () {
    if (homeHoverMenuEnabled && artistButton) {
      if (!arcMenu.classList.contains("open")) {
        setMenuOpen(true);
      }
      return;
    }

    setMenuOpen(!arcMenu.classList.contains("open"));
  });

  var menuLinks = arcMenu.querySelectorAll("a.menu-item");
  menuLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      var href = link.getAttribute("href") || "";
      setStatus("STATUS: OPENING " + href, 420);
      window.setTimeout(function () {
        window.location.href = href;
      }, 420);
    });
  });

  document.addEventListener("click", function (event) {
    if (!arcMenu.classList.contains("open")) {
      return;
    }

    var target = event.target;
    if ((artistButton && artistButton.contains(target)) || (profileMenuToggle && profileMenuToggle.contains(target)) || arcMenu.contains(target)) {
      return;
    }
    setMenuOpen(false);
  });
})();
