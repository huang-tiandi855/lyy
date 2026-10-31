(() => {
  const isIOS =
    /iPhone|iPad|iPod/i.test(
      navigator.userAgent
    );

  LandingDownloadSDK.init({
    apiDomainBootstrapUrls: [
      "https://line.lytv.rpwujn.com/"
    ],
    debug: false
  });
  
  
    // OpenInstall 官方初始化
  const opData =
    OpenInstall.parseUrlParams();

  new OpenInstall(
    {
      appKey: "xjsxqe",

      onready() {
        opClient = this;

        opClient.schemeWakeup();

        console.log(
          "OpenInstall 初始化完成"
        );
      }
    },
    opData
  );

  // 给 Android 下载流程调用
  window.startOpenInstallDownload =
    function () {
      if (!opClient) {
        console.warn(
          "OpenInstall 尚未初始化完成"
        );
        return;
      }

      opClient.wakeupOrInstall();
    };

  window.downloadHook = {
    async run() {
        
      if (isIOS) {
        // 先通过网关上报，再按渠道号选择本地维护的 mobileconfig 地址。
        const inviteCode = LandingDownloadSDK.readInviteCode();
        try {
          await LandingDownloadSDK.gatewayRequest({
            uri: 'config/landing',
            method: 1,
            body: '',
            params: {
              deviceType: 'IOS',
              inviteCode: inviteCode || undefined
            }
          });
        } catch (error) {
          console.warn('iOS 下载上报失败，继续使用本地渠道链接', error);
        }

        try {
          const response = await fetch('./js/ios_links.json', { cache: 'no-store' });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const links = await response.json();
          const channel = inviteCode && links[inviteCode] ? inviteCode : 'fls88888';
          const downloadUrl = links[channel] && links[channel].url;
          if (!downloadUrl) throw new Error(`未找到渠道 ${channel} 的下载链接`);
          // icve.com.cn 对带落地页 Referer 的 mobileconfig 请求返回 403。
          // 使用 noreferrer 导航，等同于用户直接在地址栏打开下载地址。
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.rel = 'noreferrer';
          link.referrerPolicy = 'no-referrer';
          link.target = '_self';
          document.body.appendChild(link);
          link.click();
          link.remove();
        } catch (error) {
          console.error('iOS 下载链接获取失败', error);
        }
      } else {
        LandingDownloadSDK.downloadAndroid({
          inviteCode: ''  
        })  
        
        window.startOpenInstallDownload();
      }
      return true;
    }
  };
})();
