def fcheck_EQ : Joined<["-"], "fcheck=">,
  Group<f_Group>, Flags<[FlangOption, CC1Option]>,
  HelpText<"Enable runtime checks. Supported: bounds">;
