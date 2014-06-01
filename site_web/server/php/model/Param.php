<?php

class Param extends ActiveRecord\Model
{
    public static $table_name = 'param';
    static $belongs_to = array(
        array('model3d'),
        array('specParam')
    );

    public function set_value($value) {
        if($this->specParam->value_min !== null && $value < $this->specParam->value_min)
            throw new Exception('Valeur inférieure au minimum !');
        if($this->specParam->value_max !== null && $value > $this->specParam->value_max)
            throw new Exception('Valeur supérieure au maximum !');
        $this->assign_attribute('value', $value);
    }
}
