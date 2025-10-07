const MainPanel = {
  baseStyle: {
    float: { base: "none", xl: "right" },
    maxWidth: "100%",
    overflow: "auto",
    position: "relative",
    maxHeight: "100%",
    transition: "all 0.33s cubic-bezier(0.685, 0.0473, 0.346, 1)",
    transitionDuration: ".2s, .2s, .35s",
    transitionProperty: "top, bottom, width",
    transitionTimingFunction: "linear, linear, ease",
    width: { base: "100%", xl: "calc(100% - 275px)" },
    marginLeft: { base: "0px", xl: "275px" },
    paddingX: { base: "10px", md: "20px", xl: "0px" },
  },
  variants: {
    main: (props) => ({
      float: { base: "none", xl: "right" },
    }),
    rtl: (props) => ({
      float: { base: "none", xl: "left" },
    }),
  },
  defaultProps: {
    variant: "main",
  },
};

export const MainPanelComponent = {
  components: {
    MainPanel,
  },
};
