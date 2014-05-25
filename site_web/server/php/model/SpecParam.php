<?php

//TODO: mettre tout en read-only
class SpecParam extends ActiveRecord\Model
{
    public static $table_name = 'spec_param';
    static $belongs_to = array(
        array('spec_process')
    );

}
