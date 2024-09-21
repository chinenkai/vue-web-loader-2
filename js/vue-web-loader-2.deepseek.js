(function(window, document, Vue) {
    // Polyfill for `replaceAll`
    if (!String.prototype.replaceAll) {
        String.prototype.replaceAll = function(search, replacement) {
            if (Object.prototype.toString.call(search).toLowerCase() === '[object regexp]') {
                return this.replace(search, replacement);
            }
            return this.replace(new RegExp(search, 'g'), replacement);
        };
    }

    // Polyfill for `endsWith`
    if (!String.prototype.endsWith) {
        String.prototype.endsWith = function(search, thisLen) {
            thisLen = thisLen === undefined ? this.length : thisLen;
            return this.substring(thisLen - search.length, thisLen) === search;
        };
    }

    // Vue version detection
    var vueVersion = parseInt(Vue.version.split('.')[0], 10);
    var vueApp = vueVersion === 3 ? Vue.createApp() : null;

    // Global variables
    var requestVersion = '';
    var baseUrl = '';
    var componentsRelation = {};
    var componentsCallback = {};
    var requestingComponent = {};

    // Function to evaluate JavaScript code with a source URL
    function evalJs(url, script) {
        script += '\n\n//# sourceURL=' + url;
        return eval(script);
    }

    // Function to load remote files
    function requestGet(url, callback) {
        if (requestVersion) {
            url += url.indexOf('?') > -1 ? '&v=' : '?v=';
            url += requestVersion;
        }

        return fetch(url)
            .then(function(response) {
                var fullUrl = new URL(response.url).href.replace(new URL(response.url).search, '');
                return response.text().then(function(text) {
                    return { fullUrl: fullUrl, text: text };
                });
            })
            .then(function(data) {
                callback(data.fullUrl, data.text);
            })
            .catch(function(error) {
                throw error;
            });
    }

    // Function to remove comments from a script
    function removeComments(script) {
        // Remove multi-line comments
        script = script.replace(/\/\*[\s\S]*?\*\//g, '');
        // Remove single-line comments
        script = script.replace(/([^\\])\/\/.*/g, '$1');
        return script;
    }

    // Function to parse an absolute URL
    function parseAbsoluteUrl(url, parentUrl) {
        return new URL(url, parentUrl).href;
    }

    // Function to parse import statements
    function parseImport(parentUrl, script) {
        var list = [];
        script = removeComments(script);

        if (!script) return { script: script, list: list };

        var scriptCopy = script;
        var regexp = /import([\s\S].+)from([\s\S].+["'])/g;

        var match;
        while ((match = regexp.exec(script)) !== null) {
            var mContent = match[0];
            var vName = match[1].trim();
            var fName = match[2].replace(/["'\s]/gi, '');
            var prevCode = '\n/*\n' + mContent + '\n*/\nvar ' + vName + ' = window.';

            if (fName.endsWith('.js') || fName.endsWith('.vue')) {
                var absoluteUrl = parseAbsoluteUrl(fName, parentUrl);
                scriptCopy = scriptCopy.replace(mContent, prevCode + 'VueWebLoader.registeredComponent["' + absoluteUrl + '"];\n');
                list.push(absoluteUrl);
                continue;
            }

            scriptCopy = scriptCopy.replace(mContent, prevCode + vName + ';\n');
        }

        return { script: scriptCopy, list: list };
    }

    // Function to check parent import progress
    function checkParentImportProgress(url) {
        for (var parent in componentsRelation) {
            var parentList = componentsRelation[parent];
            var reloop = false;

            for (var child in parentList) {
                if (child === url) {
                    reloop = true;
                    parentList[url] = true;
                    componentsRelation[parent][url] = true;
                }
            }

            if (reloop) {
                var isFinish = true;
                for (var child in parentList) {
                    if (parentList[child] === false) {
                        isFinish = false;
                    }
                }

                if (isFinish) {
                    var finishCallback = componentsCallback[parent];
                    if (finishCallback) finishCallback();
                    delete componentsRelation[parent];
                    delete componentsCallback[parent];
                }
            }
        }
    }

    // Function to parse Vue SFC content
    function parseVueSFC(content) {
        var regexp = /<script[\s\S]*?>([\s\S]*)<\/script>/g;
        var match = regexp.exec(content);
        var script = match ? match[1] : '';
        var style = '';
        var template = '';

        var element = document.createElement('div');
        element.innerHTML = content;

        for (var i = 0; i < element.children.length; i++) {
            var child = element.children[i];
            if (child.tagName === 'TEMPLATE') {
                template = child.innerHTML.replace('inside-script', 'script');
            } else if (child.tagName === 'STYLE') {
                style = child.innerHTML.trim();
            }
        }

        return { style: style, script: script, template: template };
    }

    // Function to parse URL to name
    function parseUrlToName(url) {
        return url.substring(0, url.lastIndexOf('.')).replace(baseUrl, '').replace(/\//g, '_');
    }

    // Function to append style to the document
    function appendStyle(name, style) {
        var el = document.createElement('style');
        el.id = name;
        el.type = 'text/css';
        el.innerHTML = style;
        document.head.appendChild(el);
    }

    // Function to register Vue SFC
    function registerVueSFC(url, template, script, style) {
        var name = parseUrlToName(url);

        if (style) appendStyle(name, style);

        VueWebLoader.componentTemplate[name] = template;

        var regexp = /([\S\s]*)export\s+default\s+{([\S\s]*})/g;
        var match = regexp.exec(script);
        var js = (match[1] ? match[1] : '') + '\n (function(){ return {\n    template: VueWebLoader.componentTemplate["' + name + '"],' + match[2] + '})();';

        var setting = evalJs(url, js);
        var component = null;

        if (vueVersion === 3) {
            vueApp.component(name, setting);
            component = vueApp.component(name);
        } else {
            component = Vue.component(name, setting);
        }

        delete VueWebLoader.componentTemplate[name];
        return component;
    }

    // Function to request Vue component
    function requestVue(vueUrl, callback) {
        if (requestingComponent[vueUrl]) return true;
        requestingComponent[vueUrl] = true;

        requestGet(vueUrl, function(url, content) {
            var result = parseVueSFC(content);
            var style = result.style;
            var script = result.script;
            var template = result.template;

            var result2 = parseImport(url, script);
            var parsedScript = result2.script;
            var list = result2.list;

            importComponents(url, list, function() {
                VueWebLoader.registeredComponent[url] = registerVueSFC(url, template, parsedScript, style);
                checkParentImportProgress(url);
                if (callback) callback(VueWebLoader.registeredComponent[url]);
            });
        });
    }

    // Function to request JavaScript file
    function requestJs(jsUrl, callback) {
        if (requestingComponent[jsUrl]) return true;
        requestingComponent[jsUrl] = true;

        requestGet(jsUrl, function(url, content) {
            var result = parseImport(url, content);
            var script = result.script;
            var list = result.list;

            importComponents(url, list, function() {
                script = '\n window.VueWebLoader.registeredComponent["' + url + '"] = (function(){\n' +
                    script.replace('export default ', 'return ') + '\n})();';
                evalJs(url, script);
                checkParentImportProgress(url);
                if (callback) callback(VueWebLoader.registeredComponent[url]);
            });
        });
    }

    // Function to import components
    function importComponents(parentUrl, list, callback) {
        if (!componentsRelation[parentUrl]) {
            componentsRelation[parentUrl] = {};
            componentsCallback[parentUrl] = callback;
        }

        if (list.length === 0) return callback();

        var isFinish = true;
        var childUrl = '';

        for (var i = 0; i < list.length; i++) {
            var url = list[i];
            if (VueWebLoader.registeredComponent[url]) {
                componentsRelation[parentUrl][url] = true;
                childUrl = url;
            } else {
                isFinish = false;
                componentsRelation[parentUrl][url] = false;

                if (requestingComponent[url]) continue;

                if (url.endsWith('.vue')) {
                    requestVue(url);
                } else if (url.endsWith('.js')) {
                    requestJs(url);
                }
            }
        }

        if (isFinish) checkParentImportProgress(childUrl);
    }

    // VueWebLoader constructor
    var VueWebLoader = function(setting) {
        if (setting.version) requestVersion = setting.version;

        var startTime = Date.now();
        var entry = setting.entry;

        console.log('开始加载Vue项目入口JS文件：' + entry);

        requestGet(entry, function(url, content) {
            baseUrl = url.substring(0, url.indexOf(entry));
            var result = parseImport(url, content);
            var script = result.script;
            var list = result.list;

            importComponents(url, list, function() {
                evalJs(url, script);
                console.log('加载Vue项目入口JS文件完成，耗时:' + (Date.now() - startTime) / 1000 + ' 秒');
            });
        });
    };

    // Expose VueWebLoader to the window object
    window.VueWebLoader = Object.assign(VueWebLoader, {
        componentTemplate: {},
        registeredComponent: {},
        import: function(url, callback) {
            url = parseAbsoluteUrl(url, baseUrl);

            if (callback && VueWebLoader.registeredComponent[url]) {
                callback(VueWebLoader.registeredComponent[url]);
                return;
            }

            if (url.endsWith('.vue')) {
                requestVue(url, callback);
            } else if (url.endsWith('.js')) {
                requestJs(url, callback);
            }
        },
        importList: function(urlList, stepCallback, finalCallback) {

            function loadNextUrl(index) {
                if (index >= urlList.length) {
                    // 所有地址都加载完成
                    finalCallback();
                    return;
                }

                var url = parseAbsoluteUrl(urlList[index], baseUrl)

                // 模拟异步加载地址
                new Promise(function(resolve) {

                    if (VueWebLoader.registeredComponent[url]) {
                        resolve();
                        return;
                    }

                    if (url.endsWith('.vue')) {
                        requestVue(url, function() { resolve(); });
                    } else if (url.endsWith('.js')) {
                        requestJs(url, function() { resolve(); });
                    }

                }).then(function() {
                    // 调用step回调函数
                    stepCallback(url, VueWebLoader.registeredComponent[url]);
                    // 加载下一个地址
                    loadNextUrl(index + 1);
                }).catch(function(error) {
                    console.error(error);
                    // 加载下一个地址
                    loadNextUrl(index + 1);
                });
            }

            // 从第一个地址开始加载
            loadNextUrl(0);
        },
    });

})(window, document, Vue);