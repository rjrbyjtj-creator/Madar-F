/* MADAR — global square loader between pages */
(function(){
 if(window.__madarPageLoader)return;window.__madarPageLoader=true;
 var KEY="madar:page-transition",pending=false,internalNavigation=false,overlay=null,hideTimer=null,minVisibleAt=0;
 function theme(){
  try{var t=localStorage.getItem("theme");if(t==="dark"||t==="light")return t;
   var raw=localStorage.getItem("madar_active_theme");if(raw){var v=JSON.parse(raw);if(v&&(v.mode==="dark"||v.mode==="light"))return v.mode;}
  }catch(e){}
  var r=document.documentElement;if(r.classList.contains("dark")||r.dataset.theme==="dark"||(document.body&&document.body.classList.contains("dark-mode")))return "dark";
  if(r.dataset.theme==="light")return "light";return null;
 }
 function syncTheme(){var t=theme();if(t)document.documentElement.dataset.theme=t;}
 try{pending=sessionStorage.getItem(KEY)==="1";if(pending)sessionStorage.removeItem(KEY);}catch(e){}
 function ensureCss(){
  if(document.getElementById("madar-page-loader-css"))return;
  var l=document.createElement("link");l.id="madar-page-loader-css";l.rel="stylesheet";var href="./css/page-loader.css";
  var ss=document.getElementsByTagName("script");for(var i=0;i<ss.length;i++){var u=ss[i].src||"";if(u.indexOf("page-loader.js")!==-1){href=u.replace(/js\/page-loader\.js(\?.*)?$/,"css/page-loader.css");break;}}
  l.href=href;document.head.appendChild(l);
 }
 ensureCss();
  function createGridLoader(root, opts) {
    opts = opts || {};
    var jelly = opts.jelly != null ? opts.jelly : 1.6;
    var duration = opts.duration != null ? opts.duration : 1.7;
    var SQ = 24, STEP = SQ + 5, OUT = 36, WIND = 10, BASE = 2.2, N = 264, W = 13, dt = BASE / N;
    var els = [].slice.call(root.children);
    var start = [[STEP, STEP], [STEP, 0], [0, 0], [0, STEP]];
    var moves = [
      [0, 0, OUT, 0.02],
      [1, 1, STEP, 0.09],
      [2, 0, STEP, 0.17],
      [3, 1, -STEP, 0.25],
      [0, 0, WIND, 0.45, 11, 0.9],
      [0, 0, -(OUT + WIND), 0.54, 20, 0.98],
      [1, 0, -STEP, 0.554, 22, 0.7]
    ];

    function build(j) {
      var z = Math.max(0.5, 0.95 - 0.27 * j);
      function spring(s, w, zz) {
        if (s <= 0) return 0;
        var wd = w * Math.sqrt(1 - zz * zz);
        return 1 - Math.exp(-zz * w * s) * (Math.cos(wd * s) + ((zz * w) / wd) * Math.sin(wd * s));
      }
      var k = 1 - Math.exp(-dt / 0.035);
      return els.map(function (_, e) {
        var P = [0, 1].map(function (a) {
          return Array.from({ length: N + 1 }, function (_, i) {
            var v = start[e][a];
            for (var mi = 0; mi < moves.length; mi++) {
              var m = moves[mi];
              if (m[0] === e && m[1] === a) {
                var w = m[4] != null ? m[4] : W;
                var zz = m[5] != null ? m[5] : z;
                v += m[2] * spring((i / N - m[3]) * BASE, w, zz);
              }
            }
            return v;
          });
        });
        var D = P.map(function (p) {
          function at(i) {
            return p[Math.min(Math.max(i, 0), N)];
          }
          var sp = p.map(function (_, i) {
            return Math.abs(at(i + 1) - at(i - 1)) / (2 * dt) / (0.5 * W * STEP);
          });
          var lp = 0;
          return sp.map(function (s, i) {
            var n = sp[Math.min(i + 1, N)] - sp[Math.max(i - 1, 0)];
            var dec = Math.max(0, -n / (2 * dt)) / (0.7 * W);
            lp += (j * (0.17 * s - 0.1 * dec) - lp) * k;
            return 0.3 * Math.tanh(lp / 0.3);
          });
        });
        return P[0].map(function (x, i) {
          var dx = D[0][i],
            dy = D[1][i];
          return {
            transform:
              "translate3d(" +
              x.toFixed(2) +
              "px," +
              P[1][i].toFixed(2) +
              "px,0) scale(" +
              (1 + dx - 0.8 * dy).toFixed(4) +
              "," +
              (1 + dy - 0.8 * dx).toFixed(4) +
              ")"
          };
        });
      });
    }

    var frames = build(jelly);
    var anims = els.map(function (el, i) {
      return el.animate(frames[i], {
        duration: BASE * 1000,
        iterations: Infinity,
        easing: "linear"
      });
    });
    var t0 = document.timeline ? document.timeline.currentTime : 0;
    anims.forEach(function (a) {
      a.startTime = t0;
      a.updatePlaybackRate(BASE / duration);
    });
    return {
      destroy: function () {
        anims.forEach(function (a) {
          a.cancel();
        });
      }
    };
  }
 function mount(){
  if(overlay)return overlay;overlay=document.createElement("div");overlay.id="madar-page-loader";overlay.setAttribute("aria-hidden","true");
  overlay.innerHTML='<div class="mpl-stage"><div class="flat-grid-loader" role="status" aria-label="در حال بارگذاری"><span></span><span></span><span></span><span></span></div></div>';
  (document.body||document.documentElement).appendChild(overlay);
  var reduce=false;try{reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;}catch(e){}
  createGridLoader(overlay.querySelector(".flat-grid-loader"),reduce?{jelly:.3,duration:3.2}:{jelly:1.6,duration:1.7});return overlay;
 }
 function show(minDuration){syncTheme();mount();clearTimeout(hideTimer);minVisibleAt=Date.now()+(typeof minDuration==="number"?minDuration:5000);overlay.classList.remove("leaving");void overlay.offsetWidth;overlay.classList.add("on");overlay.setAttribute("aria-hidden","false");}
 function hide(soft){if(!overlay)return;clearTimeout(hideTimer);if(soft===false){overlay.classList.remove("on","leaving");overlay.setAttribute("aria-hidden","true");return;}
  hideTimer=setTimeout(function(){overlay.classList.add("leaving");overlay.classList.remove("on");hideTimer=setTimeout(function(){if(overlay){overlay.classList.remove("leaving");overlay.setAttribute("aria-hidden","true");}},760);},Math.max(0,minVisibleAt-Date.now()));
 }
 function sameOrigin(h){try{return new URL(h,location.href).origin===location.origin;}catch(e){return false;}}
 function shouldHandle(a){if(!a||a.target==="_blank"||a.hasAttribute("download"))return false;var h=a.getAttribute("href");if(!h||h.charAt(0)==="#"||/^(javascript:|mailto:|tel:)/i.test(h)||a.dataset.noLoader==="1")return false;return sameOrigin(h);}
 document.addEventListener("click",function(e){if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;var a=e.target.closest&&e.target.closest("a[href]");if(!shouldHandle(a))return;var h=a.href;if(h===location.href)return;e.preventDefault();internalNavigation=true;try{sessionStorage.setItem(KEY,"1");}catch(err){}show();setTimeout(function(){location.href=h;},360);},false);
 document.addEventListener("submit",function(e){var f=e.target;if(f&&f.dataset.noLoader!=="1"&&sameOrigin(f.getAttribute("action")||location.href))internalNavigation=true;},true);
 window.addEventListener("beforeunload",function(){if(internalNavigation){try{sessionStorage.setItem(KEY,"1");}catch(e){}}});
 function incoming(){if(!pending)return;show(5000);var done=function(){hide(true);};if(document.readyState==="complete")done();else window.addEventListener("load",done,{once:true});}
 if(pending){if(document.body)incoming();else document.addEventListener("DOMContentLoaded",incoming,{once:true});}
 else{show(7000);var startupDone=function(){hide(true);};if(document.readyState==="complete")startupDone();else window.addEventListener("load",startupDone,{once:true});}
 window.addEventListener("pageshow",function(e){if(e.persisted){try{sessionStorage.removeItem(KEY);}catch(err){}show();hide(true);syncTheme();}});
 window.MadarLoader={show:show,hide:hide};
})();
