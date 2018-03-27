CREATE  TABLE IF NOT EXISTS `openidm`.`clusteredrecontargetids` (
  `objectid` VARCHAR(38) NOT NULL ,
  `rev` VARCHAR(38) NOT NULL ,
  `reconid` VARCHAR(255) NOT NULL ,
  `targetids` LONGTEXT NOT NULL ,
  INDEX `idx_clusteredrecontargetids_reconid` (`reconid` ASC) ,
  PRIMARY KEY (`objectid`) )
ENGINE = InnoDB;
