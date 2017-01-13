	(function() {
		"use strict";
		var Dom = {
			top_nav: $("#top_nav"),
			bottom_nav: $(".bottom_nav"),
			font_button: $("#font_button"),
			font_container: $(".font-container"),
			bk_container_current: $(".bk-container-current"),
			day: $("#day_icon"),
			night: $("#night_icon")

		}

		var divs = [$("#border_one"), $("#border_two"), $("#border_three"), $("#border_four"), $("#border_five"), $("#border_six")];

		var Util = (function() {
			var prefix = 'html5_reader_';
			var storageGetter = function(key) {
				return localStorage.getItem(prefix + key);
			}
			var storageSetter = function(key, val) {
				return localStorage.setItem(prefix + key, val);
			}
			var getBSONP = function(url, callback) {
				return $.jsonp({
					url: url,
					cache: true,
					callback: 'duokan_fiction_chapter',
					success: function(result) {
						var data = $.base64.decode(result);
						//decodeURIComponent() 函数可对 encodeURIComponent() 函数编码的 URI 进行解码。
						//escape() 函数可对字符串进行编码，这样就可以在所有的计算机上读取该字符串。
						var json = decodeURIComponent(escape(data));
						callback(json);
					}
				})
			}
			return {
				getBSONP: getBSONP,
				storageGetter: storageGetter,
				storageSetter: storageSetter
			}
		})()

		var Win = $(window);
		var Doc = $(document);
		var readerModel;
		var readerUI;
		var fiction_container = $("#fiction_container");
		var initFontSize = Util.storageGetter("font_size");
		initFontSize = parseInt(initFontSize);
		if(!initFontSize) {
			initFontSize = 14;
		}
		fiction_container.css("font-size", initFontSize);

		function main() {
			//整个项目的入口函数
			readerModel = ReaderModel();
			readerUI = ReaderBaseFrame(fiction_container);
			readerModel.init(function(data) {
				readerUI(data);
			});
			EventHanlder();
		}

		function ReaderModel() {
			//todo 实现和阅读器相关的数据交互的方法
			var Chapter_id;
			var ChapterTotal;
			var init = function(UIcallback) {
				/*getFictionInfo(function() {
					getCurChapterContent(Chapter_id, function(data) {
						UIcallback && UIcallback(data);
					});
				})*/
				getFictionInfoPromise().then(function(d) {
					return getCurChapterContentPromise();
				}).then(function(d) {
					UIcallback && UIcallback(d);
				})
			}
			var getFictionInfo = function(callback) {
				$.get('data/chapter.json', function(data) {
					//获得章节信息之后的回调
					Chapter_id = Util.storageGetter('last_chapter_id');
					if(Chapter_id == null) {
						Chapter_id = data.chapters[1].chapter_id;
					}
					ChapterTotal = data.chapters.length;
					callback && callback();
				}, 'json');
			}

			var getFictionInfoPromise = function() {
				return new Promise(function(resolve, reject) {
					$.get('data/chapter.json', function(data) {
						//获得章节信息之后的回调
						if(data.result == 0) {
							Chapter_id = Util.storageGetter('last_chapter_id');
							if(Chapter_id == null) {
								Chapter_id = data.chapters[1].chapter_id;
							}
							ChapterTotal = data.chapters.length;
							resolve();
						} else {
							reject();
						}

					}, 'json');
				});
			}

			var getCurChapterContent = function(chapter_id, callback) {
				$.get('data/data' + Chapter_id + '.json', function(data) {
					if(data.result == 0) {
						var url = data.jsonp;
						Util.getBSONP(url, function(data) {
							callback && callback(data);
						});
					}
				}, 'json')
			}

			var getCurChapterContentPromise = function() {
				return new Promise(function(resolve, reject) {
					$.get('data/data' + Chapter_id + '.json', function(data) {
						if(data.result == 0) {
							var url = data.jsonp;
							Util.getBSONP(url, function(data) {
								resolve(data);
							});
						} else {
							reject({
								"msg": 'fail'
							});
						}
					}, 'json')
				});
			}

			var prevChapter = function(UIcallback) {
				Chapter_id = parseInt(Chapter_id, 10);
				if(Chapter_id == 0) {
					return;
				}
				Chapter_id -= 1;
				getCurChapterContent(Chapter_id, UIcallback);
				Util.storageSetter('last_chapter_id', Chapter_id)
			}
			var nextChapter = function(UIcallback) {
				Chapter_id = parseInt(Chapter_id, 10);
				if(Chapter_id == ChapterTotal) {
					return;
				}
				Chapter_id += 1;
				getCurChapterContent(Chapter_id, UIcallback);
				Util.storageSetter('last_chapter_id', Chapter_id)

			}
			return {
				init: init,
				prevChapter: prevChapter,
				nextChapter: nextChapter
			}

		}

		function ReaderBaseFrame(container) {
			//todo 渲染基本UI结构
			function parseChapterData(jsonData) {
				var jsonObj = JSON.parse(jsonData);
				var html = '<h4>' + jsonObj.t + '</h4>';
				for(var i = 0; i < jsonObj.p.length; i++) {
					html += "<p>" + jsonObj.p[i] + "</p>"
				}
				return html;
			}
			return function(data) {
				container.html(parseChapterData(data));
			}
		}

		function EventHanlder() {
			//todo 交互事件绑定
			//触摸屏幕中心显示上下导航栏
			$("#action_middle").click(function() {
				if(Dom.top_nav.css("display") == "none") {
					Dom.top_nav.show();
					Dom.bottom_nav.show();
				} else {
					Dom.top_nav.hide();
					Dom.bottom_nav.hide();
					Dom.font_container.hide();
					Dom.font_button.removeClass("current");
				}
			});

			Dom.font_button.click(function() {
				//切换显示字号与背景面板
				if(Dom.font_container.css("display") == "none") {
					Dom.font_container.show();
					Dom.font_button.addClass("current");
				} else {
					Dom.font_container.hide();
					Dom.font_button.removeClass("current");
				}
			})

			//增大字体
			$("#large_font").click(function() {
				if(initFontSize > 18) {
					return;
				}
				initFontSize += 1;
				fiction_container.css("font-size", initFontSize);
				Util.storageSetter("font_size", initFontSize);
			})

			//缩小字体
			$("#small_font").click(function() {
				if(initFontSize < 13) {
					return;
				}
				initFontSize -= 1;
				fiction_container.css("font-size", initFontSize);
				Util.storageSetter("font_size", initFontSize);
			})

			//清除所有的边框
			function clear_border() {
				$.each(divs, function(key2) {
					divs[key2].css("border", "none");
				})
			}

			//选择背景颜色
			$.each(divs, function(key) {
				$(divs[key]).click(function() {
					clear_border();
					//设置当前选中的边框
					divs[key].css("border", "1px solid #ff6c00");
					//设置阅读区的背景颜色
					fiction_container.css("background", divs[key].children("div").css("background"));
					//储存键值对
					Util.storageSetter("borderColor", "1px solid #ff6c00");
					Util.storageSetter("readerBgColor", divs[key].children("div").css("background"));
				})

				var bc = Util.storageGetter("borderColor");
				var rc = Util.storageGetter("readerBgColor");
				divs[key].css("border", bc);
				fiction_container.css("background", rc);
				clear_border();
			});

			$("#night_day_button").click(function() {
				if($("#day_icon").css("display") == "block") {
					$("#day_icon").css("display", "none");
					$("#night_icon").css("display", "block");
					////清除所有的边框
					clear_border();
					$("#border_six").css("border", "1px solid #ff6c00");
					fiction_container.css("background", "#000000");
					//储存键值对
					Util.storageSetter("borderColor", "1px solid #ff6c00");
					Util.storageSetter("readerBgColor", "#000000");

				} else {
					$("#day_icon").css("display", "block");
					$("#night_icon").css("display", "none");
					clear_border();
					$("#border_one").css("border", "1px solid #ff6c00");
					fiction_container.css("background", "#ffffff");
					//储存键值对
					Util.storageSetter("borderColor", "1px solid #ff6c00");
					Util.storageSetter("readerBgColor", "#ffffff");
				}
			})

			//窗口滚动时隐藏上下导航
			Win.scroll(function() {
				Dom.top_nav.hide();
				Dom.bottom_nav.hide();
				Dom.font_container.hide();
				Dom.font_button.removeClass("current");
			});

			$("#prev_button").click(function() {
				//获得章节翻页数据，把数据拿出来渲染
				readerModel.prevChapter(function(data) {
					readerUI(data);
				});

			})
			$("#next_button").click(function() {
				readerModel.nextChapter(function(data) {
					readerUI(data);
				});
			})
		}

		main();
	})();
