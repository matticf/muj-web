/* Jiří Matyáš – online vizitka */
(function () {
  "use strict";

  // Aktuální rok v patičce
  var rok = document.getElementById("rok");
  if (rok) {
    rok.textContent = new Date().getFullYear();
  }

  // Jednoznakové předložky a spojky nesmí zůstat na konci řádku.
  // V HTML jsou ošetřené ručně (&nbsp;), tohle je pojistka pro nové texty.
  var vzor = /(^|[\s(„])([vkszouaiVKSZOUAI])\s+/g;
  var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: function (node) {
      var rodic = node.parentNode && node.parentNode.nodeName;
      return rodic === "SCRIPT" || rodic === "STYLE"
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT;
    }
  });
  var uzel;
  while ((uzel = walker.nextNode())) {
    var text = uzel.nodeValue;
    var novy = text.replace(vzor, "$1$2 ");
    // Druhý průchod pro po sobě jdoucí předložky, např. „a v kraji“
    novy = novy.replace(vzor, "$1$2 ");
    if (novy !== text) {
      uzel.nodeValue = novy;
    }
  }

  if (!("IntersectionObserver" in window)) {
    return;
  }

  // ---------- Pohyb a 3D efekty ----------
  var html = document.documentElement;
  var pohyb = html.classList.contains("js-motion");
  var mys = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (pohyb) {
    // Postupné vyjetí obsahu při scrollování. Prvky se stejným rodičem
    // vyjíždějí s malým zpožděním za sebou.
    var vyber = [
      ".hero__text > *",
      ".hero__photo",
      ".section h2",
      "#o-mne p",
      ".area",
      ".timeline__item",
      ".certs h3",
      ".certs__list li",
      "#kontakt p",
      ".contact__actions"
    ].join(",");
    var reveal = new IntersectionObserver(function (zaznamy) {
      zaznamy.forEach(function (z) {
        if (z.isIntersecting) {
          z.target.classList.add("is-visible");
          reveal.unobserve(z.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });

    document.querySelectorAll(vyber).forEach(function (el) {
      var sourozenci = Array.prototype.filter.call(el.parentNode.children, function (s) {
        return s.matches(vyber);
      });
      var poradi = Math.min(sourozenci.indexOf(el), 5);
      el.style.setProperty("--delay", poradi * 0.09 + "s");
      el.classList.add("reveal");
      // Po dojetí animace třídu odebrat, aby nepřekážela efektům při najetí myší
      el.addEventListener("transitionend", function hotovo(e) {
        if (e.target === el && e.propertyName === "opacity" && el.classList.contains("is-visible")) {
          el.classList.remove("reveal", "is-visible");
          el.style.removeProperty("--delay");
          el.removeEventListener("transitionend", hotovo);
        }
      });
      reveal.observe(el);
    });
  }

  if (pohyb && mys) {
    // 3D náklon podle pozice myši
    document.querySelectorAll("[data-tilt]").forEach(function (el) {
      var max = el.classList.contains("hero__photo") ? 10 : 12;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transition = "transform 0.1s ease-out";
        el.style.transform = "perspective(800px) rotateX(" + (-y * max).toFixed(2) +
          "deg) rotateY(" + (x * max).toFixed(2) + "deg)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transition = "transform 0.5s ease";
        el.style.transform = "";
      });
    });
  }

  if (pohyb) {
    // Časová osa se plní červenou podle toho, kam čtenář doscrolloval
    var osa = document.querySelector(".timeline");
    var polozky = document.querySelectorAll(".timeline__item");
    var cekam = false;
    var obnovOsu = function () {
      cekam = false;
      var r = osa.getBoundingClientRect();
      var cil = window.innerHeight * 0.6;
      var podil = Math.max(0, Math.min(1, (cil - r.top) / r.height));
      osa.style.setProperty("--progress", podil.toFixed(3));
      polozky.forEach(function (p) {
        p.classList.toggle("is-passed", p.getBoundingClientRect().top + 12 < cil);
      });
    };
    if (osa) {
      window.addEventListener("scroll", function () {
        if (!cekam) {
          cekam = true;
          window.requestAnimationFrame(obnovOsu);
        }
      }, { passive: true });
      window.addEventListener("resize", obnovOsu);
      document.querySelectorAll(".older").forEach(function (d) {
        d.addEventListener("toggle", obnovOsu);
      });
      obnovOsu();
    }
  }

  // ---------- Zvýraznění aktuální sekce v navigaci ----------
  var odkazy = document.querySelectorAll(".site-nav a");
  if (!odkazy.length) {
    return;
  }
  var mapa = {};
  odkazy.forEach(function (a) {
    mapa[a.getAttribute("href").slice(1)] = a;
  });
  var observer = new IntersectionObserver(function (zaznamy) {
    zaznamy.forEach(function (z) {
      if (z.isIntersecting) {
        odkazy.forEach(function (a) { a.classList.remove("is-active"); });
        // Úvod nemá v navigaci odkaz, takže se zvýraznění jen zruší
        if (mapa[z.target.id]) {
          mapa[z.target.id].classList.add("is-active");
        }
      }
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  ["uvod"].concat(Object.keys(mapa)).forEach(function (id) {
    var sekce = document.getElementById(id);
    if (sekce) {
      observer.observe(sekce);
    }
  });
})();
